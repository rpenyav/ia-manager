package com.neria.manager.adapters;

public class ProviderInvocationResult {
  private final Object output;
  private final int tokensIn;
  private final int tokensOut;
  private final double costUsd;

  public ProviderInvocationResult(Object output, int tokensIn, int tokensOut, double costUsd) {
    this.output = output;
    this.tokensIn = tokensIn;
    this.tokensOut = tokensOut;
    this.costUsd = costUsd;
  }

  public Object getOutput() {
    return output;
  }

  public int getTokensIn() {
    return tokensIn;
  }

  public int getTokensOut() {
    return tokensOut;
  }

  public double getCostUsd() {
    return costUsd;
  }
}
