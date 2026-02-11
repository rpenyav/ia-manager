package com.neria.manager.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tenants")
public class Tenant {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(nullable = false, length = 32)
  private String status;

  @Column(name = "killSwitch", nullable = false)
  private boolean killSwitch;

  @Column(name = "authUsername", length = 120)
  private String authUsername;

  @Column(name = "authPasswordHash", length = 255)
  private String authPasswordHash;

  @Column(name = "authMustChangePassword", nullable = false)
  private boolean authMustChangePassword;

  @Column(name = "billingEmail", length = 160)
  private String billingEmail;

  @Column(name = "companyName", length = 180)
  private String companyName;

  @Column(name = "contactName", length = 180)
  private String contactName;

  @Column(name = "phone", length = 40)
  private String phone;

  @Column(name = "addressLine1", length = 180)
  private String addressLine1;

  @Column(name = "addressLine2", length = 180)
  private String addressLine2;

  @Column(name = "city", length = 120)
  private String city;

  @Column(name = "postalCode", length = 20)
  private String postalCode;

  @Column(name = "country", length = 80)
  private String country;

  @Column(name = "billingAddressLine1", length = 180)
  private String billingAddressLine1;

  @Column(name = "billingAddressLine2", length = 180)
  private String billingAddressLine2;

  @Column(name = "billingCity", length = 120)
  private String billingCity;

  @Column(name = "billingPostalCode", length = 20)
  private String billingPostalCode;

  @Column(name = "billingCountry", length = 80)
  private String billingCountry;

  @Column(name = "taxId", length = 40)
  private String taxId;

  @Column(name = "website", length = 180)
  private String website;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
