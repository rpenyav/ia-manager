package com.neria.manager.common.services;

import com.neria.manager.config.AppProperties;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class EncryptionService {
  private static final int IV_LENGTH = 12;
  private static final int TAG_LENGTH = 16;
  private final SecretKeySpec keySpec;
  private final SecureRandom random = new SecureRandom();

  public EncryptionService(AppProperties properties) {
    String rawKey = properties.getSecurity().getEncryptionKey();
    if (rawKey == null || rawKey.length() < 32) {
      throw new IllegalStateException("ENCRYPTION_KEY must be at least 32 characters");
    }
    byte[] keyBytes = rawKey.substring(0, 32).getBytes(StandardCharsets.UTF_8);
    this.keySpec = new SecretKeySpec(keyBytes, "AES");
  }

  public String encrypt(String plainText) {
    try {
      byte[] iv = new byte[IV_LENGTH];
      random.nextBytes(iv);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(TAG_LENGTH * 8, iv));
      byte[] cipherWithTag = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
      int cipherLen = cipherWithTag.length - TAG_LENGTH;
      byte[] cipherText = new byte[cipherLen];
      byte[] tag = new byte[TAG_LENGTH];
      System.arraycopy(cipherWithTag, 0, cipherText, 0, cipherLen);
      System.arraycopy(cipherWithTag, cipherLen, tag, 0, TAG_LENGTH);
      ByteBuffer buffer = ByteBuffer.allocate(IV_LENGTH + TAG_LENGTH + cipherText.length);
      buffer.put(iv);
      buffer.put(tag);
      buffer.put(cipherText);
      return Base64.getEncoder().encodeToString(buffer.array());
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to encrypt payload", ex);
    }
  }

  public String decrypt(String payload) {
    try {
      byte[] input = Base64.getDecoder().decode(payload);
      ByteBuffer buffer = ByteBuffer.wrap(input);
      byte[] iv = new byte[IV_LENGTH];
      buffer.get(iv);
      byte[] tag = new byte[TAG_LENGTH];
      buffer.get(tag);
      byte[] cipherText = new byte[buffer.remaining()];
      buffer.get(cipherText);
      byte[] encrypted = ByteBuffer.allocate(cipherText.length + TAG_LENGTH)
          .put(cipherText)
          .put(tag)
          .array();
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(TAG_LENGTH * 8, iv));
      byte[] decrypted = cipher.doFinal(encrypted);
      return new String(decrypted, StandardCharsets.UTF_8);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to decrypt payload", ex);
    }
  }
}
