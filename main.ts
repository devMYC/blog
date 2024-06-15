// import blog from 'https://deno.land/x/blog@0.3.3/blog.tsx';
import blog from 'https://raw.githubusercontent.com/devMYC/deno_blog/8e2af0605bd82f97b6c598ee54bf21ebc4ff0cd9/blog.tsx';

blog({
    title: 'Yichao Ma',
    author: 'Yichao Ma',
    description: 'Random posts of various topics.',
    avatar: './green-black-checkered.png',
    avatarClass: 'rounded-full',
    links: [
        { title: "Email", url: "mailto:mycha0@hotmail.com" },
        { title: "GitHub", url: "https://github.com/devMYC" },
    ],
    background: '#f9f9f9',
    lang: 'en',
    middlewares: [],
});
