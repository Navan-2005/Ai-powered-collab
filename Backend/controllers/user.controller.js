import  userModel from "../model/user.model.js";
import * as userService from "../services/user.service.js"; 
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";

export const createUserController=async (req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {email,password}=req.body;
    try {
        const user=await userService.createUser({email,password});
        const token=await user.generateJWT();
        delete user._doc.password;
        return res.status(201).json({user,token});
    } catch (error) {
        return res.status(500).json({error:error.message});
    }
}

export const loginController=async (req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {email,password}=req.body;
    try {
        const user=await userModel.findOne({email}).select('+password');
        if(!user){
            return res.status(404).json({error:'User not found'});
        }

        const isMatch=await user.isValidPassword(password);
        if(!isMatch){
            return res.status(401).json({error:'Invalid credentials'});
        }
        const token=await user.generateJWT();
        delete user._doc.password;
                console.log(user);
                
        return res.status(200).json({user,token});
    } catch (error) {
        return res.status(500).json({error:error.message});
    }
}

export const profileController=async (req,res)=>{
    try {
        const user=req.user;
        return res.status(200).json({user:user});
    } catch (error) {
        return res.status(500).json({error:error.message});
    }
}

export const logoutController=async (req,res)=>{
    try {
        const token=req.cookies.token || req.headers.authorization.split(' ')[ 1 ];
        await redisClient.set(token, 'true', 'EX', 60 * 60 * 24); // 1 day in seconds   
        return res.status(200).json({message:'Logout successful'});
    } catch (error) {    
        return res.status(500).json({error:error.message});
    }
}

export const getAllUsersController = async (req, res) => {
    try {

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const allUsers = await userService.getAllUsers({ userId: loggedInUser._id });

        return res.status(200).json({
            users: allUsers
        })

    } catch (err) {

        console.log(err)

        res.status(400).json({ error: err.message })

    }
}