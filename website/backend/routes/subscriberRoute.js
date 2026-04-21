import express from 'express';
import { addSubscriber, unsubscribe } from '../controllers/subscriberController.js';

const subscriberRouter = express.Router();

subscriberRouter.post('/subscribe', addSubscriber);
subscriberRouter.post('/unsubscribe', unsubscribe);

export default subscriberRouter;