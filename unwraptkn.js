const ethers = require('ethers');
const axios = require('axios');

const provider = new ethers.JsonRpcProvider('');

const tokenContractAddress = '0x7cF551258d6871b72EE1bD1624588a6245bF48c4';
const abi = ['function balanceOf(address owner) public view returns (uint256)'];
const contract = new ethers.Contract(tokenContractAddress, abi, provider);


const walletAddress = '0x55A1dd7eB606Da6e5A546AC62b9a9E90CB495A9A';
const unwrapAbi = ['function unwrap(uint256 amount) public', 'function balanceOf(address owner) public view returns (uint256)']
let lastBalance = BigInt('0');
const unwrapperContract = new ethers.Contract(walletAddress, unwrapAbi, provider)

const walletPrivateKey = '';
const walletAddr = '';
const wallet = new ethers.Wallet(walletPrivateKey, provider);

const contractWithSigner = unwrapperContract.connect(wallet);
let checkBalanceInterval;

async function checkBalance() {
    console.log('Checking balance...')
    const balance = await contract.balanceOf(walletAddress);
    const tokensLeftToUnwrap = await unwrapperContract.balanceOf(walletAddr);

    console.log('current contract balance:' + ethers.formatEther(balance))
    
    if (balance > lastBalance && tokensLeftToUnwrap > 0) {
        const increase = balance - lastBalance;
        console.log('Balance increased! New balance: ' + ethers.formatEther(balance));
        notifyTelegram('Balance increased! New balance: ' + ethers.formatEther(balance));

        if (increase <= tokensLeftToUnwrap) {
            const tx = await contractWithSigner.unwrap(increase);
            console.log('Unwrap transaction sent, tx hash:', tx.hash);
            notifyTelegram('Unwrap transaction sent, tx hash: ' + tx.hash);
            notifyTelegram('Unwrapped amount: ' + ethers.formatEther(increase) + ' Chitcat');
            notifyTelegram('current wallet balance:' + ethers.formatEther(tokensLeftToUnwrap));
        } else {
            const tx = await contractWithSigner.unwrap(tokensLeftToUnwrap);
            console.log('Unwrap transaction sent, tx hash:', tx.hash);
            notifyTelegram('Unwrap transaction sent, tx hash: ' + tx.hash);
            notifyTelegram('Unwrapped amount: ' + ethers.formatEther(tokensLeftToUnwrap) + ' Chitcat');
            notifyTelegram('current wallet balance:' + ethers.formatEther(tokensLeftToUnwrap));
        }
        
        lastBalance = balance;
    } else if (tokensLeftToUnwrap == 0) {
        clearInterval(checkBalanceInterval);
        notifyTelegram('All tokens unwrapped!');
    }
}

async function notifyTelegram(message) {
    const url = `https://api.telegram.org/bot<BOT_KEY>/sendMessage<CHAT_ID>?chat_id=&text=${encodeURIComponent(message)}`;
    try {
        await axios.get(url);
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}

notifyTelegram('Starting unwrap checker...');
checkBalance();
checkBalanceInterval = setInterval(checkBalance, 10000);
