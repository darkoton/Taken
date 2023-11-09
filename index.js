import path from "path";
import fs from "fs";
import express from "express";
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const routerFolder = path.join(path.resolve(), "routes")
const routerFiles = (await fs.readdirSync(routerFolder)).filter(file => file.endsWith('.js'))

routerFiles.forEach(async file => {
  const router = await import(`./routes/${file}`)
  app.use(router.index, router.routes);
})


app.listen(PORT, () => {
  console.log(`server starting on http://localhost:${PORT}`)
})