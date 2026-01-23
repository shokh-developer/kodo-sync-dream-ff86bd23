server: {
  host: true, // hamma xostlarga ruxsat
  port: process.env.PORT ? Number(process.env.PORT) : 4173, // Render portni env orqali oladi
  hmr: {
    overlay: false,
  },
}
