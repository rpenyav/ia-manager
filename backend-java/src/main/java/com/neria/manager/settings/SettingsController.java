package com.neria.manager.settings;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/settings")
public class SettingsController {
  private final SettingsService settingsService;

  public SettingsController(SettingsService settingsService) {
    this.settingsService = settingsService;
  }

  private void requireAdmin(HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireAdmin(auth);
  }

  @GetMapping("/kill-switch")
  public Map<String, Object> getKillSwitch(HttpServletRequest request) {
    requireAdmin(request);
    return settingsService.getGlobalKillSwitch();
  }

  @PatchMapping("/kill-switch")
  public Map<String, Object> setKillSwitch(
      HttpServletRequest request, @RequestBody ToggleRequest dto) {
    requireAdmin(request);
    return settingsService.setGlobalKillSwitch(Boolean.TRUE.equals(dto.enabled));
  }

  @GetMapping("/alerts-schedule")
  public Map<String, Object> getAlertsSchedule(HttpServletRequest request) {
    requireAdmin(request);
    return settingsService.getAlertsSchedule();
  }

  @PatchMapping("/alerts-schedule")
  public Map<String, Object> updateAlertsSchedule(
      HttpServletRequest request, @RequestBody AlertsScheduleRequest dto) {
    requireAdmin(request);
    return settingsService.setAlertsSchedule(dto.cron, dto.minIntervalMinutes);
  }

  @GetMapping("/debug-mode")
  public Map<String, Object> getDebugMode(HttpServletRequest request) {
    requireAdmin(request);
    return settingsService.getDebugMode();
  }

  @PatchMapping("/debug-mode")
  public Map<String, Object> setDebugMode(
      HttpServletRequest request, @RequestBody ToggleRequest dto) {
    requireAdmin(request);
    return settingsService.setDebugMode(Boolean.TRUE.equals(dto.enabled));
  }

  @PostMapping("/debug/purge")
  public Map<String, Object> purge(HttpServletRequest request, @RequestBody PurgeRequest dto) {
    requireAdmin(request);
    return settingsService.purgeResources(dto.resources);
  }

  public static class ToggleRequest {
    public Boolean enabled;
  }

  public static class AlertsScheduleRequest {
    public String cron;
    public int minIntervalMinutes;
  }

  public static class PurgeRequest {
    public java.util.List<String> resources;
  }
}
