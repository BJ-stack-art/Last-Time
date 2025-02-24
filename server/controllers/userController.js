const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

class UserController {
    static register = async (req,res,next) => {
        const {name , email , password} = req.body
        try {
            await User.create({
                name, email, 
                password: bcrypt.hashSync(password),
                role: "user",
            })
            res.status(201).send({
                message: "Account Has Register Successfully"
            })
        } catch (error) {
            next(error)
        }
    }

    static login = async (req,res,next) => {
        const {email, password} = req.body
        try {
            let user = await User.findOne({ email: email })
            if(!user) return next({name: "Validation" , message: "Invalid Email/Password"})
            
            let checkPassword = bcrypt.compareSync(password, user.password)
            if(!checkPassword) return next({name: "Validation" , message: "Invalid Email/Password"})
            if(email && password === "null" || ""){
                return next({name: "Validation", message: "Column Can't Null"})
            }

            // token
            let payload = {
                userId: user.id,
                updatedAt: user.updatedAt,
                role: user.role,
            }
            const token = jwt.sign(payload, process.env.JWT_KEY)
            const role = user.role
            const subRole = user.subRole
            user = {
                id: user._id,
                name: user.name,
            }
            res.status(200).json({
                token,user,role,subRole
            })
        } catch (error) {
            next(error)
        }
    }

    static detailByToken  = async (req,res,next) => {
        let id = req.currentUser._id
        try {
            const user = await User.findById(id).select("-password -__v")
            if(!user) return next({name: "NotFound"})

            res.status(200).send({user})
        } catch (error) {
            next(error)
        }
    }

    static createAdmin = async(req,res,next) => {
        const {name, email, password} = req.body
        try {
            await User.create({
                name, email, 
                password: bcrypt.hashSync(password),
                role: "admin",
            })
            res.status(201).send({
                message: 'Admin Has Created Successfully'
            })
        } catch (error) {
            next(error)
        }
    }

    static totalByRoles = async (req,res,next) => {
        try {
            const admins = await User.find({role: "admin"}).count()
            const members = await User.find({role: "user", subRole: "normal"}).count()
            const pickupers = await User.find({subRole: "pickuper"}).count()

            res.status(200).send({admins, members, pickupers})
        } catch (error) {
            next(error)
        }
    }

    static detail = async (req,res,next) => {
        const {id} = req.params
        try {
            const user = await User.findById(id).select("-password -__v")
            if(!user) return next({name: "NotFound"})

            res.status(200).send({user})
        } catch (error) {
            next(error)
        }
    }

    static deleteUser = async(req,res,next) => {
        const {id} = req.params
        try {
            const user = await User.findByIdAndDelete(id)
            if(!user) return next({name: "NotFound"})
            res.status(200).json({
                message: "Deleted user successfully",
                id: user._id,
            })
        } catch (error) {
            next(error)
        }
    }

    static getByRole = async (req,res,next) => {
        const {role} = req.params
        try {
            const users = role === 'admin' ?
                    await User.find({role}).select("name email")
                    : await User.find({role , subRole: 'normal'}).select("name email")
            res.status(200).send({users})
        } catch (error) {
            next(error)
        }
    }

    static getBySubRole = async (req,res,next) => {
        const {subRole} = req.params
        try {
            const users = await User.find({subRole , role: "user"}).select("name email")
            res.status(200).send({users})
        } catch (error) {
            next(error)
        }
    }

}

module.exports = UserController