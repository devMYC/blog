// import blog from 'https://deno.land/x/blog@0.3.3/blog.tsx';
// import blog from 'https://raw.githubusercontent.com/devMYC/deno_blog/87b4744bf5aac47e10b52c88437d0e08715821fb/blog.tsx';
import blog from 'https://raw.githubusercontent.com/devMYC/deno_blog/cv/blog.tsx';

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
