import {app}  from './src/app.js' 
import { Dbconnect } from "./src/db/index.js";
await Dbconnect();
app.listen(process.env.PORT, () =>
  console.log(`Server is running on ${process.env.PORT}`)
);
