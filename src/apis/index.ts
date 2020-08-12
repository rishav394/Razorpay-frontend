import axios from 'axios';
import { PaymentResponse } from './types';

// Make an axios client for the end user
const Victor = axios.create({
	baseURL: process.env.REACT_APP_SERVER_URL,
});

/**
 * Calls the backend order route
 * @param amount Amount in INR
 */
export const generateOrder = async (amount: number) => {
	const response = await Victor.post(`/order`, {
		amount: amount,
	});
	return response;
};

/**
 * Calls the backend capture routes
 * @param payment The Payment response object which razorpat sends us for capturing and verification
 * @param amount The amonut which we send for additional capturing and verification
 */
export const recievePayment = async (
	payment: PaymentResponse,
	amount: number,
) => {
	const response = await Victor.post(
		`/capture/${payment.razorpay_payment_id}`,
		{
			amount: amount,
			...payment,
		},
	);
	return response;
};
