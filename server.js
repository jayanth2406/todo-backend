import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const SECRET = process.env.SECRET

const todoSchema = new mongoose.Schema({
    email: String,
    text: String,
})

const userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
})

const PORT = process.env.PORT
const startServer = async () => {
 await mongoose.connect(process.env.MONGO_URI)
 app.listen(PORT,()=>console.log("Server Started"))
}
startServer();

const userModel = mongoose.model("User", userSchema)
const todoModel= mongoose.model("Todo", todoSchema)

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader) return res.status(401).json({ message: "No token provided" })
        const token = authHeader.split(" ")[1]
        const user = await jwt.verify(token, SECRET)
        req.user = user
        next()
    }
    catch (error) {
        res.status(401).json({ message: "Unauthorized" })
    }
}

app.post("/register", async (req, res) => {
    console.log(req.body)
    const hashpassword = await bcrypt.hash(req.body.password, 10)
    req.body.password = hashpassword
    const user = await userModel.create(req.body)
    res.json(user)
})
app.post("/login", async (req, res) => {
    const { email, password } = req.body
    const user = await userModel.findOne({ email })
    if (user) {
        const chkPassword = await bcrypt.compare(password, user.password)
        if (chkPassword) {
            const obj = { id: user._id, name: user.name, email: user.email }
            const token = await jwt.sign(obj, SECRET, { expiresIn: "1hr" })
            res.json({ ...obj, token, success: true })
        }
        else {
            res.json({ message: "Invalid Password", success: false })
        }
    }
    else {
        res.json({ message: "User not found", success: false })
    }
})

app.get("/todo", authenticate, async (req, res) => {
    const notes = await todoModel.find({ email: req.user.email });
    res.json(notes);
});
app.post("/todo", authenticate, async (req, res) => {
    const { text } = req.body;
    await todoModel.create({ text, email: req.user.email });
    res.json({ message: "todo added" });
});
app.delete("/todo/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    await todoModel.findByIdAndDelete(id);
    res.json({ message: "todo deleted" });
});


