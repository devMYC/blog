---
title: Server-Sent Events (SSE) with Deno
publish_date: 2024-07-05 (PST)
abstract: Unidirectional event messages from server to client.
---

Communications between web page (or some other client apps) and server are usually done via
request/response pairs. But sometimes, you might want to show real-time notifications or updates
from server without keep polling the endpoint. Or when a full response could not be formed in one go
on the backend and pieces of data needed to be streamed down to client whenever they are ready.
Then server-sent events could be a good solution to these scenarios.

To demonstrate how this works, we just need a single endpoint on the server side, and a web page
to show the content from server. I will be using [Deno](https://docs.deno.com/runtime/manual/getting_started/installation/)
and [Fresh](https://fresh.deno.dev/docs/getting-started/create-a-project) because it requires just
a single command each and zero configuration to complete the setup process.

### Server

After installing Deno. Create a `sse.ts` file with the following content.

> Note: We only need this single file for the server

```ts
Deno.serve((_req) => new Response("Hello from server."));
```

Yeah, that's it. An HTTP server that returns a string for every request. To start the server, run
this command from your terminal.

```
$ deno run --allow-net sse.ts
```

The server should start listening on port `8000`. You can `curl` the server to see if it's working.
But this is still the traditional way of sending response like we've all been doing the whole time.
To tell client that the response is going to be a stream of events. We need to specify the content
type in response header.

```ts
Deno.serve((_req) => new Response(..., {
    "Access-Control-Allow-Origin": "*", // prevents CORS, be cautious with "*" in production
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    "X-Accel-Buffering": "no", // tells nginx not to buffer response
}));
```

But what should we replace that `...` with to write data to the response stream whenever we need to?
We can create a `ReadableStream` and with custom `start` and `cancel` logic. Then we can pass this
readable stream to the response constructor as the response body.

```ts
Deno.serve((_req) => {
    let stop = false;
    const rs = new ReadableStream({
        async start(controller) {
            while (!stop) {
                controller.enqueue(new Date().toISOString() + "\n");
                await sleep(1000);
            }
        },
        cancel() {
            stop = true;
        },
    });

    return new Response(rs.pipeThrough(new TextEncoderStream()), {
        headers: {
            "Access-Control-Allow-Origin": "*", // prevents CORS, be cautious with "*" in production
            "Cache-Control": "no-cache",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no", // tells nginx not to buffer response
        },
    });
});

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

Now if you `curl` the server again. You should see a clock ticking. The `cancel` function will be
called when client disconnects. So you should make sure it would be carefully handled and things
would be cleaned up to avoid memory leak.

### Event message format

SSE uses a stream of UTF-8 encoded text as messages. It supports two different message formats:

&bull; data-only messages

```
data: content\n\n
```

&bull; named events

```
event: name\ndata: content\n\n
```

A line starts with `:` is treated as comment and will be ignored by client. It's useful to periodically
send a short comment just to keep the connection alive. For now, let's use data-only messages for
our example by making this change:

```diff
async start(controller) {
    while (!stop) {
-       controller.enqueue(new Date().toISOString() + "\n");
+       controller.enqueue("data: " + JSON.stringify({ ts: new Date().toISOString() }) + "\n\n");
        await sleep(1000);
    }
},
```

### Client

Create a project using Fresh. You should be able to see an example in browser after running the
project locally using `deno task start`. We can replace everything in `routes/index.tsx` with

```ts
import SSE from "../islands/SSE.tsx";

export default function Home() {
  return (
      <SSE />
  );
}
```

Now we need to create the missing file `islands/SSE.tsx`. The logic for this component is simple.
We connect to our server when the component will be mount. Handle incoming data-only messages (i.e. UTC timestamps)
and update the UI.

```ts
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

export default function SSE() {
    const stop = useSignal(false);
    const ts = useSignal("");

    useEffect(() => {
        if (stop.value) return;

        const evtSrc = new EventSource("//localhost:8000");
        evtSrc.onerror = (evt) => {
            console.error(evt);
            stop.value = true;
        };
        evtSrc.onmessage = (evt: MessageEvent<string>) => {
            console.log(evt);
            const data: { ts: string } = JSON.parse(evt.data);
            ts.value = new Date(data.ts).toLocaleString();
        };

        return () => evtSrc.close();
    }, [stop.value]);

    return (
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
            <h1>SSE Demo</h1>
            <button onClick={() => stop.value = !stop.value}>
                {stop.value ? "resume" : "stop"}
            </button>
            <h3>{ts.value}</h3>
        </div>
    );
};
```

If you run the project again. You should be able to see the localized datetime string shown on the
page and it's updated every second like a clock. You can stop and resume the clock which disconnects
and reconnects to the backend respectively. Now let's trying multiplexing the connection with different
types of events.

### Back to server

As mentioned earlier, SSE also supports named events which allows us to send different events to
client through the same connection. In addition to the timestamps we are currently sending to client.
Let's maintain global state (i.e. a number) so we can run [FizzBuzz](https://en.wikipedia.org/wiki/Fizz_buzz)
using this number. This global state will be updated every 2.5 seconds. For each connected client,
it will first grab a copy of the current global state as its initial local state. And it will send
the output of FizzBuzz based on _local_ state (also updated every 2.5 seconds) to client.
We will use `timestamp` and `fizzbuzz` as the event names.

```ts
Deno.serve((_req) => {
    const ctx = { stop: false }
    const rs = new ReadableStream({
        async start(controller) {
            await Promise.all([
                fizzBuzz(controller, ctx),
                clock(controller, ctx),
            ]);
        },
        cancel() {
            ctx.stop = true;
        },
    });

    return new Response(rs.pipeThrough(new TextEncoderStream()), {
        headers: {
            "Access-Control-Allow-Origin": "*", // prevents CORS, be cautious with "*" in production
            "Cache-Control": "no-cache",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no", // tells nginx not to buffer response
        },
    });
});

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const state: Readonly<{ n: number }> = (() => {
    const state = { n: 1 };
    setInterval(() => { ++state.n; }, 2500);
    return state;
})();

async function fizzBuzz(
    controller: ReadableStreamDefaultController<unknown>,
    ctx: Readonly<{ stop: boolean }>,
) {
    let n = state.n; // copy global state as init value of local state
    let s: string;

    while (!ctx.stop) {
        if (n%15 === 0) {
            s = "FizzBuzz";
        } else if (n%3 === 0) {
            s = "Fizz";
        } else if (n%5 === 0) {
            s = "Buzz";
        } else {
            s = n.toString();
        }

        n++;
        controller.enqueue(
            "event: fizzbuzz\n" +
            "data: " + s + "\n\n",
        );
        await sleep(2500);
    }
}

async function clock(
    controller: ReadableStreamDefaultController<unknown>,
    ctx: Readonly<{ stop: boolean }>,
) {
    while (!ctx.stop) {
        controller.enqueue(
            "event: timestamp\n" +
            "data: " + JSON.stringify({ ts: new Date().toISOString() }) + "\n\n",
        );
        await sleep(1000);
    }
}
```

But now, if you restart server and visit the web page again. You won't be able to see the clock anymore.
If you inspect the network actions from browser. You should see the events are actually being sent
to the client from server. So there must be something wrong with our client-side code.

### Update client logic

It turns out that the `.onmessage` handler is called just for data-only messages. To handle named
events, we need to attach an event handler for each event type. We are going to add the following
code to handle `timestamp` and `fizzbuzz` events from server separately.

```diff
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

export default function SSE() {
    const stop = useSignal(false);
+   const fizzbuzz = useSignal("");
    const ts = useSignal("");
    useEffect(() => {
        if (stop.value) return;

        const evtSrc = new EventSource("//localhost:8000");
        evtSrc.onerror = (evt) => {
            console.error(evt);
            stop.value = true;
        };
        evtSrc.onmessage = (evt: MessageEvent<string>) => {
            console.log(evt);
            const data: { ts: string } = JSON.parse(evt.data);
            ts.value = new Date(data.ts).toLocaleString();
        };
+       evtSrc.addEventListener("timestamp", (evt: MessageEvent<string>) => {
+           const data: { ts: string } = JSON.parse(evt.data);
+           ts.value = new Date(data.ts).toLocaleString();
+       })
+       evtSrc.addEventListener("fizzbuzz", (evt: MessageEvent<string>) => {
+           fizzbuzz.value = evt.data;
+       });

        return () => evtSrc.close();
    }, [stop.value]);

    return (
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
            <h1>SSE Demo</h1>
            <button onClick={() => stop.value = !stop.value}>
                {stop.value ? "resume" : "stop"}
            </button>
            <h3>{ts.value}</h3>
+           <h3>{fizzbuzz.value}</h3>
        </div>
    );
};
```

Now, if you refresh the web page. You should see both clock ticking and FizzBuzz result updated
independently. And the stop/resume button should still work as before. You probably noticed that
we didn't remove the `.onmessage` handler. That's because it's totally okay to mix data-only messages
and named events together in the same connection.

### Conclusion

As you can see, SSE is quite convenient in situations where you need to push updates from server to
client. A good contemporary real-world example of this is how OpenAI API lets you choose to
[stream](https://platform.openai.com/docs/api-reference/chat/create#chat-create-stream)
the response of chat completion so you can display the words as soon as they are generated by LLM.
It makes the user feel like the AI is actually typing what it's trying to say like a human.

A caveat of using SSE over HTTP/1.1 is that the browser may have a very low limit on how many open
connections can be established for each domain. On the other hand, HTTP/2 allows a much higher default
value for this limit, and also supports negotiation between client and server.


### References

- [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
