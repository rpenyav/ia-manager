package com.neria.manager.runtime;

import java.util.Map;

public class ExecuteRequest {
  public String providerId;
  public String model;
  public Map<String, Object> payload;
  public String serviceCode;
  public String requestId;
}
