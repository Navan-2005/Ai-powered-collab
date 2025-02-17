import {Router} from "express";
import * as aiCtrl from "../controllers/ai.controller.js";
const router=Router();

router.get('/get-result',aiCtrl.getResult);

export default router