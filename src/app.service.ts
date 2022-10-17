import { HttpException, Injectable } from '@nestjs/common';
import { ethers, Signer, utils } from 'ethers';
import * as TokenJSON from './assets/MyToken.json';
import * as TokenizedBallotJSON from './assets/TokenizedBallot.json';

const CONTRACT_ADDRESS = '0x1a6B025ad0bA0005901813D32b7f8A421C905986';
const TOKENIZED_BALLOT_CONTRACT_ADDRESS =
  '0x0AAB4B203ef2B6e82922A55C69361BA7dA3C343f';

export class ClaimPaymentDTO {
  id: string;
  secret: string;
  address: string;
}

export class PaymentOrder {
  id: string;
  secret: string;
  amount: number;
}

export class VoteForm {
  proposal: string;
  amount: number;
}

class Vote extends VoteForm {
  from: string;
}

export class DelegateVote {
  to: string;
}

@Injectable()
export class AppService {
  provider: ethers.providers.Provider;
  contract: ethers.Contract;
  tokenizedBallotContract: ethers.Contract;
  signedContract: ethers.Contract;
  signedTokenizedBallotContract: ethers.Contract;
  signer: Signer;
  database: PaymentOrder[];
  recentVotes: Vote[];

  constructor() {
    const privateKey = process.env.PRIVATE_KEY;
    this.provider = ethers.getDefaultProvider('goerli');
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      TokenJSON.abi,
      this.provider,
    );
    this.tokenizedBallotContract = new ethers.Contract(
      TOKENIZED_BALLOT_CONTRACT_ADDRESS,
      TokenizedBallotJSON.abi,
      this.provider,
    );
    const wallet = new ethers.Wallet(privateKey);
    this.signer = wallet.connect(this.provider);
    this.signedContract = this.contract.connect(this.signer);
    this.signedTokenizedBallotContract = this.tokenizedBallotContract.connect(
      this.signer,
    );
    this.database = [];
    this.recentVotes = [];
  }

  async hasMinterRole(address: string) {
    const MINTER_ROLE = await this.contract.MINTER_ROLE();
    const isMinter = await this.contract.hasRole(MINTER_ROLE, address);
    return isMinter;
  }

  async getTotalSupply() {
    const totalSupplyBN = await this.contract.totalSupply();
    const totalSupply = ethers.utils.formatEther(totalSupplyBN);
    return totalSupply;
  }

  async getAllowance(from: string, to: string) {
    const allowanceBN = await this.contract.allowance(from, to);
    const allowance = ethers.utils.formatEther(allowanceBN);
    return allowance;
  }

  getTransactionByHash(hash: string) {
    return this.provider.getTransaction(hash);
  }

  async getTransactionReceiptByHash(hash: string) {
    const tx = await this.getTransactionByHash(hash);
    return await tx.wait();
  }

  createPaymentOrder(body: PaymentOrder) {
    this.database.push(body);
  }

  async claimPayment(body: ClaimPaymentDTO) {
    const order = this.database.find((e) => e.id === body.id);
    const senderAddress = await this.signer.getAddress();
    const hasMinterRole = await this.hasMinterRole(senderAddress);
    if (!order) {
      throw new HttpException('Not found', 400);
    }

    if (!hasMinterRole) {
      throw new HttpException(
        `address ${body.address} has no minter role`,
        400,
      );
    }

    const tx = await this.signedContract.mint(
      body.address,
      ethers.utils.parseEther(order.amount.toString()),
    );
    return tx;
  }

  async requestTokens(body: ClaimPaymentDTO) {
    return true;
  }

  getPaymentOrderById(id: string) {
    const order = this.database.find((e) => e.id === id);
    if (!order) {
      throw new HttpException('Not found', 400);
    }
    return { id: order.id, amount: order.amount };
  }

  listPaymentOrders() {
    return this.database.map((entry) => ({
      id: entry.id,
      amount: entry.amount,
    }));
  }

  async castVote(body: VoteForm) {
    const tx = await this.signedTokenizedBallotContract.vote(
      body.proposal,
      ethers.utils.parseEther(body.amount.toString()),
    );
    const from = await this.signer.getAddress();
    this.recentVotes.push({
      ...body,
      from,
    });
    return tx;
  }

  async checkVotingPower() {
    const senderAddress = await this.signer.getAddress();
    const result = await this.contract.getVotes(senderAddress);
    return utils.formatEther(result);
  }

  async delegateVotingPower(body: DelegateVote) {
    const tx = this.signedContract.delegate(body.to);
    return tx;
  }

  async listVotes() {
    const result = await Promise.all([
      this.tokenizedBallotContract.proposals(0),
      this.tokenizedBallotContract.proposals(1),
      this.tokenizedBallotContract.proposals(2),
    ]);
    const formatted = result.map(
      (e) => `${ethers.utils.formatEther(e.voteCount)} ETH`,
    );
    return formatted;
  }
}
