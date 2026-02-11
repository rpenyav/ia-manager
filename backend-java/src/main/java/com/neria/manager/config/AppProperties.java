package com.neria.manager.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private Cors cors = new Cors();
  private Jwt jwt = new Jwt();
  private Auth auth = new Auth();
  private Security security = new Security();
  private Cookies cookies = new Cookies();

  @Getter
  @Setter
  public static class Cors {
    private String origins = "http://localhost:5173";
  }

  @Getter
  @Setter
  public static class Jwt {
    private String secret = "dev_jwt_secret_please_change";
    private long ttl = 3600;
  }

  @Getter
  @Setter
  public static class Auth {
    private String adminClientId = "admin";
    private String adminClientSecret = "change_me";
  }

  @Getter
  @Setter
  public static class Security {
    private String apiKeySalt = "dev_api_key_salt_please_change";
    private String adminPasswordSalt = "dev_admin_password_salt_change_me";
    private String tenantPasswordSalt = "dev_tenant_password_salt_change_me";
    private String encryptionKey = "";
  }

  @Getter
  @Setter
  public static class Cookies {
    private boolean secure = false;
    private String sameSite = "lax";
  }
}
