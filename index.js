const server = require('./server');
const PORT = process.env.PORT || '3001';
server.app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
