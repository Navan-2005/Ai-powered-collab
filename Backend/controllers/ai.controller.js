import * as ai from '../services/ai.service.js';
import { query } from 'express';
export const getResult=async(req,res)=>{
    try {
        const {prompt}=req.query;
        const result=await ai.generateResult(prompt);
        res.send(result);
    } catch (error) {
        console.log(error);
        
        res.status(500).send(error.message);
    }
}