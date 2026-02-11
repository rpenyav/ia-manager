package com.neria.manager.common.services;

import com.lambdaworks.crypto.SCrypt;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import org.springframework.stereotype.Component;

@Component
public class ScryptHasher {
  private static final int N = 16384;
  private static final int R = 8;
  private static final int P = 1;
  private static final int KEY_LEN = 32;

  public String hash(String value, String salt) {
    try {
      byte[] derived =
          SCrypt.scrypt(
              value.getBytes(StandardCharsets.UTF_8),
              salt.getBytes(StandardCharsets.UTF_8),
              N,
              R,
              P,
              KEY_LEN);
      return toHex(derived);
    } catch (GeneralSecurityException ex) {
      throw new IllegalStateException("Unable to hash value", ex);
    }
  }

  public boolean matches(String value, String salt, String expectedHex) {
    if (expectedHex == null || expectedHex.isBlank()) {
      return false;
    }
    String computed = hash(value, salt);
    return MessageDigest.isEqual(computed.getBytes(StandardCharsets.UTF_8), expectedHex.getBytes(StandardCharsets.UTF_8));
  }

  private String toHex(byte[] input) {
    StringBuilder sb = new StringBuilder(input.length * 2);
    for (byte b : input) {
      sb.append(String.format("%02x", b));
    }
    return sb.toString();
  }
}
