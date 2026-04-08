const server = Bun.serve({
  port: 10011,
  fetch(request) {
    return new Response('Hello, World!')
  },
})

console.log(`Server running at http://localhost:${server.port}`)
