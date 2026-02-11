package com.neria.manager.common.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  public void sendPasswordReset(String to, String resetUrl) {
    log.info("[email] Password reset to={} url={}", to, resetUrl);
  }

  public void sendGeneric(java.util.List<String> to, String subject, String body) {
    log.info("[email] to={} subject={} body={}", to, subject, body);
  }

  public void sendSubscriptionPaymentEmail(
      String to, String paymentUrl, String tenantName, double amountEur) {
    String subject = "Confirmación de suscripción";
    String body =
        "Hola,\n\n"
            + "Tu suscripción para "
            + tenantName
            + " está pendiente de confirmación.\n"
            + "Importe: "
            + amountEur
            + " EUR\n\n"
            + "Confirma el pago en: "
            + paymentUrl
            + "\n";
    sendGeneric(java.util.List.of(to), subject, body);
  }
}
