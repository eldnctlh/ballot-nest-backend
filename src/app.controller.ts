import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  AppService,
  ClaimPaymentDTO,
  PaymentOrder,
  VoteForm,
  DelegateVote,
} from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('get-total-supply')
  getTotalSupply() {
    return this.appService.getTotalSupply();
  }

  @Get('allowance')
  getAllowance(@Query('from') from: string, @Query('to') to: string) {
    return this.appService.getAllowance(from, to);
  }

  @Get('transaction-by-hash/:hash')
  getTransactionByHash(@Param('hash') hash: string) {
    return this.appService.getTransactionByHash(hash);
  }

  @Get('transaction-receipt-by-hash/:hash')
  getTransactionReceiptByHash(@Param('hash') hash: string) {
    return this.appService.getTransactionReceiptByHash(hash);
  }

  @Get('list-payment-orders')
  listPaymentOrders() {
    return this.appService.listPaymentOrders();
  }

  @Get('payment-order/:id')
  getPaymentOrder(@Param('id') id: string) {
    return this.appService.getPaymentOrderById(id);
  }

  @Get('has-minter-role/:address')
  checkRole(@Param('address') address: string) {
    return this.appService.hasMinterRole(address);
  }

  @Get('list-votes')
  listVotes() {
    return this.appService.listVotes();
  }

  @Get('check-voting-power')
  checkVotingPower() {
    return this.appService.checkVotingPower();
  }

  @Post('delegate-voting-power')
  delegateVotingPower(@Body() body: DelegateVote) {
    return this.appService.delegateVotingPower(body);
  }

  @Post('create-order')
  createOrder(@Body() body: PaymentOrder) {
    return this.appService.createPaymentOrder(body);
  }

  @Post('claim-payment')
  claimPayment(@Body() body: ClaimPaymentDTO) {
    return this.appService.claimPayment(body);
  }

  @Post('request-voting-tokens')
  requestTokens(@Body() body: ClaimPaymentDTO) {
    return this.appService.requestTokens(body);
  }

  @Post('cast-vote')
  castVote(@Body() body: VoteForm) {
    return this.appService.castVote(body);
  }
}
