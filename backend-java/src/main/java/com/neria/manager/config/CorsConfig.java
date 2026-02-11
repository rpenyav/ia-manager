package com.neria.manager.config;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {
  @Bean
  public CorsFilter corsFilter(AppProperties properties) {
    List<String> origins =
        Arrays.stream(properties.getCors().getOrigins().split(","))
            .map(String::trim)
            .filter(item -> !item.isBlank())
            .map(item -> item.replaceAll("^[\"']|[\"']$", ""))
            .collect(Collectors.toList());

    CorsConfiguration config = new CorsConfiguration();
    if (origins.contains("*")) {
      config.addAllowedOriginPattern("*");
    } else {
      origins.forEach(config::addAllowedOrigin);
    }
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return new CorsFilter(source);
  }
}
