import React, { ChangeEvent, useState } from 'react';
import { generateOrder, recievePayment } from './apis';
import Modal from 'react-modal';
import { Strings } from './constants/strings';
import { PaymentResponse } from './apis/types';
import { constants } from './constants';

const App: React.FC = () => {
	const [amount, setAmount] = useState(0);
	const [midProcess, setMidProcess] = useState(false);
	const [validationError, setValidationError] = useState('');
	const [modalText, setModalText] = useState('');

	// Modal Styles so that the modal is center aligned
	const customStyles = {
		content: {
			top: '50%',
			left: '50%',
			right: 'auto',
			bottom: 'auto',
			marginRight: '-50%',
			transform: 'translate(-50%, -50%)',
		},
	};

	Modal.setAppElement('#root');

	/**
	 * Handles the simulated amount change in the cart.
	 * @param event HTMLInputElement event
	 */
	const handleCartAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
		const newAmount = parseInt(event.target.value);
		if (newAmount > 0) {
			setValidationError(Strings.empty);
		} else {
			setValidationError(Strings.invalidAmount);
			setMidProcess(false);
		}

		setAmount(newAmount);
	};

	/**
	 * Handles the pay now button event
	 * @param event HTMLButtonElement event
	 */
	const handlePayment = async (
		event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
	) => {
		if (amount <= 0) {
			setValidationError(Strings.invalidAmount);
			return;
		}

		event.preventDefault();
		setMidProcess(true);

		// Use the axios client to hit out order api
		const response = await generateOrder(amount);
		const { data } = response;

		// Build options object to be used by razorpay
		// Ref: https://razorpay.com/docs/payment-gateway/quick-integration/
		const options = {
			key: constants.razorKey, // THis can be pubic knowledge
			name: constants.paymentname,
			description: constants.paymentdesc,
			order_id: data.id,
			// Razor pay standard checkout handler https://razorpay.com/docs/payment-gateway/web-integration/standard/
			handler: async (response: PaymentResponse) => {
				try {
					await recievePayment(response, amount);
					setMidProcess(false);
					// At this point server must have verified the payment and we have the money in our bank
					setModalText(Strings.payment.ok);
				} catch (err) {
					setMidProcess(false);
					setModalText(`${Strings.payment.error} err`);
				}
			},
			theme: {
				color: constants.theme,
			},
			prefill: {
				name: constants.prefill.name,
				email: constants.prefill.email,
				contact: constants.prefill.contact,
			},
		};

		// @ts-ignore We can add this to the window object so typescript does not complain about it
		const rzp1 = new window.Razorpay(options);
		rzp1.open();

		// Allow button to be clicked again
		setMidProcess(false);
	};

	return (
		<div
			style={{
				width: 'max-content',
			}}
		>
			<Modal style={customStyles} isOpen={modalText.length > 0}>
				<div
					style={{
						textAlign: 'center',
					}}
				>
					{modalText}
					<button
						style={{
							...styleSheet.button,
							background: '##CBE9F6',
							borderColor: '##88DDFC',
							margin: 10,
						}}
						onClick={() => {
							setModalText('');
						}}
					>
						OK
					</button>
				</div>
			</Modal>
			<div style={styleSheet.rootmain}>
				<div style={styleSheet.simu}>{Strings.idea}</div>
				<label>{Strings.label}</label>
				<input
					style={styleSheet.input}
					type="number"
					onChange={handleCartAmountChange}
					value={amount}
					min={10}
					max={10000}
					placeholder={Strings.cartPlaceholder}
				/>
				{validationError && (
					<div style={styleSheet.validation}>{validationError}</div>
				)}
				<button
					style={styleSheet.button}
					disabled={midProcess}
					onClick={handlePayment}
				>
					{midProcess ? 'Processing...' : Strings.payNow}
				</button>
			</div>
			<div
				style={{
					position: 'absolute',
					bottom: 0,
				}}
			>
				Backend is located at - {process.env.REACT_APP_SERVER_URL}
			</div>
		</div>
	);
};

export default App;

const styleSheet: { [key: string]: React.CSSProperties } = {
	rootmain: {
		display: 'flex',
		flexDirection: 'column',
		padding: 30,
		minWidth: 500,
	},
	simu: {
		margin: 4,
		color: 'gray',
		fontSize: 11,
		textAlign: 'right',
	},
	input: {
		padding: '12px 20px',
		margin: '8px 0',
		boxSizing: 'border-box',
		border: '2px solid orange',
		borderRadius: '4px',
	},
	button: {
		padding: '10px 20px',
		textAlign: 'center',
		textDecoration: 'none',
		display: 'inline-block',
		fontSize: '14px',
		margin: '2px 2px',
		transitionDuration: '0.4s',
		cursor: 'pointer',
		backgroundColor: 'white',
		color: 'black',
		border: '2px solid #4CAF50',
		width: '50%',
		alignSelf: 'center',
	},
	validation: {
		fontSize: '11px',
		color: 'red',
		marginLeft: '1%',
		marginTop: '-6px',
	},
};
