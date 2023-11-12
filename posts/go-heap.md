---
title: Using the heap package in Go
publish_date: 2022-06-17 (EDT)
abstract: Heap data structure provided by Go's standard library.
cover_html: <svg class='diagram' xmlns='http://www.w3.org/2000/svg' version='1.1' height='121' width='312'><g transform='translate(8,16)'><path d='M 64,80 L 72,64' fill='none' stroke='currentColor'></path><path d='M 88,32 L 96,16' fill='none' stroke='currentColor'></path><path d='M 112,80 L 120,64' fill='none' stroke='currentColor'></path><path d='M 216,80 L 224,64' fill='none' stroke='currentColor'></path><path d='M 240,32 L 248,16' fill='none' stroke='currentColor'></path><path d='M 264,80 L 272,64' fill='none' stroke='currentColor'></path><path d='M 88,64 L 96,80' fill='none' stroke='currentColor'></path><path d='M 112,16 L 120,32' fill='none' stroke='currentColor'></path><path d='M 136,64 L 144,80' fill='none' stroke='currentColor'></path><path d='M 240,64 L 248,80' fill='none' stroke='currentColor'></path><path d='M 264,16 L 272,32' fill='none' stroke='currentColor'></path><path d='M 288,64 L 296,80' fill='none' stroke='currentColor'></path><text text-anchor='middle' x='64' y='100' fill='currentColor' style='font-size:1em'>5</text><text text-anchor='middle' x='80' y='52' fill='currentColor' style='font-size:1em'>3</text><text text-anchor='middle' x='96' y='100' fill='currentColor' style='font-size:1em'>4</text><text text-anchor='middle' x='104' y='4' fill='currentColor' style='font-size:1em'>1</text><text text-anchor='middle' x='112' y='100' fill='currentColor' style='font-size:1em'>7</text><text text-anchor='middle' x='128' y='52' fill='currentColor' style='font-size:1em'>2</text><text text-anchor='middle' x='144' y='100' fill='currentColor' style='font-size:1em'>6</text><text text-anchor='middle' x='216' y='100' fill='currentColor' style='font-size:1em'>3</text><text text-anchor='middle' x='232' y='52' fill='currentColor' style='font-size:1em'>5</text><text text-anchor='middle' x='248' y='100' fill='currentColor' style='font-size:1em'>4</text><text text-anchor='middle' x='256' y='4' fill='currentColor' style='font-size:1em'>7</text><text text-anchor='middle' x='264' y='100' fill='currentColor' style='font-size:1em'>1</text><text text-anchor='middle' x='280' y='52' fill='currentColor' style='font-size:1em'>6</text><text text-anchor='middle' x='296' y='100' fill='currentColor' style='font-size:1em'>2</text></g></svg>
---

[Heap](https://en.wikipedia.org/wiki/Heap_(data_structure))
is an efficient data structure for retrieving the minimum or
maximum element in constant time. Moreover, modifying operations
(`push`, `pop`, and `update`) only take logarithmic time.
A typical use case is using a heap as the underlying data
structure when implementing a priority queue. Although,
heap is usually visualized using a tree-shaped representation
for easier understanding. But it's common to implement heap
using an array.

It seems that the `container/heap` package in the standard library
does not provide a default implementation. Instead, it exposes
an interface that we can implement for any data structure to
make it act as a heap.

```go
/* container/heap/heap.go */
type Interface interface {
        sort.Interface
        Push(x any) // add x as element Len()
        Pop() any   // remove and return element Len() - 1.
}
```

Say we would like to store integers in the heap. We can then
make a type alias of integer slice and implement the methods
required by `heap.Interface`.

```go
type minHeap []int

func (h minHeap) Len() int {
        return len(h)
}

func (h minHeap) Less(i, j int) bool {
        return h[i] < h[j]
}

func (h minHeap) Swap(i, j int) {
        h[i], h[j] = h[j], h[i]
}

func (h *minHeap) Push(x any) {
        *h = append(*h, x.(int))
}

func (h *minHeap) Pop() any {
        last := h.Len() - 1
        x := (*h)[last]
        *h = (*h)[:last]
        return x
}
```

> __NOTE__: You might need to replace the `any` type with empty
> interface `interface{}` if you are using a version of Go
> before 1.18.

Now, let's create an instance of our `minHeap` and use it to
sort a list of integers.

```go
import (
        "container/heap"
        "fmt"
)

func main() {
        h := minHeap{5, 4, 3, 2, 1}
        heap.Init(&h) // heapify

        sorted := make([]int, 0, h.Len())
        for h.Len() > 0 {
                sorted = append(sorted, heap.Pop(&h).(int))
        }

        fmt.Println(sorted)
}
```

A frequent mistake I make is when pushing and/or popping the
heap. I sometimes accidentally wrote `h.Push(x)` and `h.Pop()`
instead of `heap.Push(&h, x)` and `heap.Pop(&h)`. Calling the
`Push` and `Pop` methods we defined on `minHeap` directly will
not cause build errors because they are totally valid Go code.
But the heap will _not_ function correctly because the custom
`Push` and `Pop` methods are supposed to be called by the `heap`
package when you call `heap.Push` and `heap.Pop`.

What if we also need a `maxHeap`? Do we need to declare a new
type and implement those methods again? You might have noticed
that all methods would be implemented the same way except for
the `Less(i, j int) bool` method used for ordering the entries
in the heap. Therefore, re-implementing every method required
by the `heap.Interface` is not ideal. Luckily, Go supports a
mechanism known as [type embedding](https://go.dev/doc/effective_go#embedding).
We can take advantage of this and "override" the `Less` method
defined on `minHeap`.

```go
type maxHeap struct {
        minHeap
}

func (h maxHeap) Less(i, j int) bool {
        return h.minHeap[i] > h.minHeap[j]
}
```

Now we can sort integers in descending order by replacing

```go
h := minHeap{5, 4, 3, 2, 1}
```

with

```go
h := maxHeap{[]int{1, 2, 3, 4, 5}}
```

in our previous example.

Another operation that is often performed is updating the
entries in the heap. If the updated value is exactly what
we used to maintain the order of the heap. Then we need to
adjust the position of the this updated entry if its current
position violates the invariance of a heap. The `heap.Fix(h heap.Interface, i int)`
method is what we need here. But in order to call `Fix`,
we need to know where the entry is within the heap. So this
means you need to keep track of the position of each entry in
the heap. And every time this entry gets moved, we need to
update the index as well to match its current position.
This can be done in the `Swap(i, j int)` method we implemented
for the `heap.Interface`.

```go
type entry struct {
        val, pos int // assume we store position along with value in heap
}

type minHeap []entry

func (h minHeap) Swap(i, j int) {
        h[i], h[j] = h[j], h[i]
        h[i].pos = i
        h[j].pos = j
}

/* modify other methods to work with the `entry` type */
```

So before you _heapify_ the `minHeap` using `heap.Init`. You
should initialize the `pos` field of each entry to its current
index in the heap. If you are pushing new entries, assign `h.Len()`
to `pos` before you append it to the underlying array. With this,
now you can fix the position of an entry after updating its
value by invoking `heap.Fix(&h, entry.pos)`. A good example
of this usage is when implementing the [Dijkstra's algorithm](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm)
which requires a heap to find the next vertex with the shortest
distance away from the source vertex efficiently.
Then use `heap.Fix` to update its neighbors' distance till every
node in the graph is processed.
I will use [2642. Design Graph With Shortest Path Calculator](https://leetcode.com/problems/design-graph-with-shortest-path-calculator/description/)
from LeetCode to demonstrate this in action. Feel free to give
it a try yourself before peeking at the solution below.

<details>
<summary>Expand to see solution</summary>

```go
const INF = math.MaxInt - 1e6

type node struct {
	pos, dis int
}

type Graph struct {
	hlen  int
	h     []int
	nodes []node
	adj   []*list.List
}

func (g Graph) Len() int {
	return g.hlen
}

func (g Graph) Less(i, j int) bool {
	return g.nodes[g.h[i]].dis < g.nodes[g.h[j]].dis
}

func (g Graph) Swap(i, j int) {
	g.h[i], g.h[j] = g.h[j], g.h[i]
	g.nodes[g.h[i]].pos = i
	g.nodes[g.h[j]].pos = j
}

func (g *Graph) Push(x any) {
	g.h = append(g.h, x.(int))
	g.hlen++
}

func (g *Graph) Pop() any {
	x := g.h[g.hlen-1]
	g.hlen--
	return x
}

func Constructor(n int, edges [][]int) Graph {
	adj := make([]*list.List, n)

	for _, e := range edges {
		from := e[0]
		if adj[from] == nil {
			adj[from] = list.New()
		}
		adj[from].PushFront(e)
	}

	return Graph{
		hlen:  n,
		h:     make([]int, n),
		nodes: make([]node, n),
		adj:   adj,
	}
}

func (g *Graph) AddEdge(edge []int) {
	from := edge[0]
	if g.adj[from] == nil {
		g.adj[from] = list.New()
	}
	g.adj[from].PushFront(edge)
}

func (g *Graph) ShortestPath(node1 int, node2 int) int {
	for i := range g.h {
		g.h[i] = i
		g.nodes[i].pos = i
		g.nodes[i].dis = INF
	}

	g.nodes[node1].dis = 0
	g.hlen = len(g.h)
	heap.Init(g)

	for g.hlen > 0 {
		from := heap.Pop(g).(int)
		g.nodes[from].pos = -1
		if g.adj[from] == nil || g.nodes[from].dis == INF {
			continue
		}

		elem := g.adj[from].Front()
		for elem != nil {
			to, cost := elem.Value.([]int)[1], elem.Value.([]int)[2]
			if g.nodes[to].pos >= 0 {
				g.nodes[to].dis = min(g.nodes[to].dis, g.nodes[from].dis+cost)
				heap.Fix(g, g.nodes[to].pos)
			}
			elem = elem.Next()
		}
	}

	if g.nodes[node2].dis == INF {
		return -1
	}
	return g.nodes[node2].dis
}

func min(x, y int) int {
	if x < y {
		return x
	}
	return y
}
```
</details>

That's all I want to share in this post. Hope there's something
useful to you. I will definitely update this post in the future
if I find more tricks we can use to do interesting things in Go
using the heap package.

### References

- [Go standard library](https://pkg.go.dev/container/heap)
