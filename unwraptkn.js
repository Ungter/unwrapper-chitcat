const ethers = require('ethers');
const axios = require('axios');

const provider = new ethers.JsonRpcProvider('https://1rpc.io/bnb');

const tokenContractAddress = '0x7cF551258d6871b72EE1bD1624588a6245bF48c4';
const abi = ['function balanceOf(address owner) public view returns (uint256)'];
const contract = new ethers.Contract(tokenContractAddress, abi, provider);


const walletAddress = '0x55A1dd7eB606Da6e5A546AC62b9a9E90CB495A9A';
const unwrapAbi = ['function unwrap(uint256 amount) public']
let lastBalance = BigInt('0');
const unwrapperContract = new ethers.Contract(walletAddress, unwrapAbi, provider)

const walletPrivateKey = '';
const wallet = new ethers.Wallet(walletPrivateKey, provider);

const contractWithSigner = unwrapperContract.connect(wallet);

async function checkBalance() {
    console.log('Checking balance...')
    const balance = await contract.balanceOf(walletAddress);

    console.log('current balance:' + ethers.formatEther(balance))
    if (balance > lastBalance) {
        const increase = balance - lastBalance;
        console.log('Balance increased! New balance: ' + ethers.formatEther(balance));
        notifyTelegram('Balance increased! New balance: ' + ethers.formatEther(balance));

        const tx = await contractWithSigner.unwrap(increase);
        console.log('Unwrap transaction sent, tx hash:', tx.hash);
        notifyTelegram('Unwrap transaction sent, tx hash: ' + tx.hash);
        notifyTelegram('Unwrapped amount: ' + ethers.formatEther(increase) + ' Chitcat');
        lastBalance = balance;
    }
}

async function notifyTelegram(message) {
    const url = `https://api.telegram.org/bot<BOT_ID>/sendMessage?chat_id=<CHAT_ID>&text=${encodeURIComponent(message)}`;
    try {
        await axios.get(url);
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}
notifyTelegram('Starting balance checker...');
checkBalance();
setInterval(checkBalance, 30000); // Check every 30 seconds
