import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const todoSchema = new mongoose.Schema({
    text: String,
})
const PORT = process.env.PORT
const startServer = async () => {
 await mongoose.connect(process.env.MONGO_URI)
 app.listen(PORT,()=>console.log("Server Started"))
}

startServer();

const todoModel= mongoose.model("Todo", todoSchema)

app.get("/todo", async (req, res) => {
  const notes = await todoModel.find();
  res.json(notes);
});
app.post("/todo", async (req, res) => {
  await todoModel.create(req.body);
  res.json({ message: "todo added" });
});
app.delete("/todo/:id", async (req, res) => {
  const { id } = req.params;
  await todoModel.findByIdAndDelete(id);
  res.json({ message: "todo deleted" });
});


