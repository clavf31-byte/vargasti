
- Marketing pages (/, /solucoes, /plataforma, /clientes, /sobre, /contato, /blog/*) must stay in AuthGuard public list in __root.tsx — otherwise visitors and crawlers get redirected to /login.
- Blog articles live as static data in src/content/blog.ts; inline links use [text](/path) rendered by RichText.
