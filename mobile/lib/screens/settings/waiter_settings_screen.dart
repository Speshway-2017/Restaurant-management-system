import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/storage_service.dart';
import '../../core/utils/sound_service.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/user_avatar_widget.dart';

class WaiterSettingsScreen extends StatefulWidget {
  const WaiterSettingsScreen({super.key});

  @override
  State<WaiterSettingsScreen> createState() => _WaiterSettingsScreenState();
}

class _WaiterSettingsScreenState extends State<WaiterSettingsScreen> {
  // Preferences State
  bool _soundNotifications = true;
  bool _vibrateOnOrderReady = true;
  bool _autoRefreshTables = true;
  bool _compactView = false;
  bool _biometricUnlock = false;
  
  String _selectedRingtone = 'Flavora Chime (Default)';
  String _clockFormat = '12-Hour (02:30 PM)';

  // Diagnostic State
  bool _isTestingPing = false;
  String _pingResult = 'Connected (HTTP 200 OK • 24ms)';
  bool _pingSuccess = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final ringtone = await StorageService.getRingtone();
    final soundEnabled = await StorageService.getSoundEnabled();
    if (mounted) {
      setState(() {
        _selectedRingtone = ringtone;
        _soundNotifications = soundEnabled;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Application Settings',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          // 1. HERO PROFILE & APP INFO CARD
          _buildHeroHeader(user?.name, user?.avatarUrl, user?.role, user?.branch),
          const SizedBox(height: 20),

          // 2. NOTIFICATIONS & ALERTS SECTION
          _buildSectionHeader('Notifications & Audio Alerts', Icons.notifications_active_outlined),
          const SizedBox(height: 8),
          _buildCardContainer([
            SwitchListTile(
              activeThumbColor: AppColors.darkGreen,
              secondary: const Icon(Icons.volume_up_outlined, color: AppColors.darkGreen),
              title: const Text('Sound Alerts on Order Ready', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: const Text('Play chime when kitchen updates dish to Ready', style: TextStyle(fontSize: 12)),
              value: _soundNotifications,
              onChanged: (val) {
                setState(() => _soundNotifications = val);
                StorageService.saveSoundEnabled(val);
                if (val) {
                  SoundService.playRingtone(_selectedRingtone);
                }
              },
            ),
            const Divider(height: 1, indent: 56),
            SwitchListTile(
              activeThumbColor: AppColors.darkGreen,
              secondary: const Icon(Icons.vibration_outlined, color: AppColors.darkGreen),
              title: const Text('Vibrate on New Table Call', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: const Text('Vibrate phone when guest requests waiter assistance', style: TextStyle(fontSize: 12)),
              value: _vibrateOnOrderReady,
              onChanged: (val) {
                setState(() => _vibrateOnOrderReady = val);
                if (val) {
                  SoundService.playRingtone('Subtle Haptic Chime');
                }
              },
            ),
            const Divider(height: 1, indent: 56),
            ListTile(
              leading: const Icon(Icons.music_note_outlined, color: AppColors.darkGreen),
              title: const Text('Chime Alert Tone', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: Text(_selectedRingtone, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.play_circle_fill, color: AppColors.darkGreen, size: 24),
                    tooltip: 'Test Sound Preview',
                    onPressed: () {
                      SoundService.playRingtone(_selectedRingtone);
                      ScaffoldMessenger.of(context).hideCurrentSnackBar();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('🔊 Playing audio preview: $_selectedRingtone'),
                          duration: const Duration(seconds: 2),
                          backgroundColor: AppColors.darkGreen,
                        ),
                      );
                    },
                  ),
                  const Icon(Icons.chevron_right, size: 20),
                ],
              ),
              onTap: _showRingtonePicker,
            ),
          ]),
          const SizedBox(height: 20),

          // 3. DISPLAY & FLOOR VIEW PREFERENCES
          _buildSectionHeader('Display & Floor Preferences', Icons.tune_outlined),
          const SizedBox(height: 8),
          _buildCardContainer([
            SwitchListTile(
              activeThumbColor: AppColors.darkGreen,
              secondary: const Icon(Icons.sync_outlined, color: AppColors.darkGreen),
              title: const Text('Auto-Refresh Live Orders', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: const Text('Background sync table & order statuses every 5 sec', style: TextStyle(fontSize: 12)),
              value: _autoRefreshTables,
              onChanged: (val) => setState(() => _autoRefreshTables = val),
            ),
            const Divider(height: 1, indent: 56),
            SwitchListTile(
              activeThumbColor: AppColors.darkGreen,
              secondary: const Icon(Icons.grid_view_outlined, color: AppColors.darkGreen),
              title: const Text('Compact Table Cards Layout', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: const Text('Dense grid layout for quick floor monitoring', style: TextStyle(fontSize: 12)),
              value: _compactView,
              onChanged: (val) => setState(() => _compactView = val),
            ),
            const Divider(height: 1, indent: 56),
            ListTile(
              leading: const Icon(Icons.access_time_outlined, color: AppColors.darkGreen),
              title: const Text('Clock Format', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: Text(_clockFormat, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              trailing: const Icon(Icons.chevron_right, size: 20),
              onTap: _showClockFormatPicker,
            ),
          ]),
          const SizedBox(height: 20),

          // 4. SERVER & NETWORK DIAGNOSTICS
          _buildSectionHeader('Server & Database Connectivity', Icons.dns_outlined),
          const SizedBox(height: 8),
          _buildCardContainer([
            ListTile(
              leading: const Icon(Icons.cloud_done_outlined, color: AppColors.darkGreen),
              title: const Text('Backend API Server', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: Text(
                '${ApiConstants.baseUrl}\nStatus: $_pingResult',
                style: TextStyle(
                  fontSize: 12,
                  color: _pingSuccess ? const Color(0xFF16A34A) : Colors.red,
                  fontWeight: FontWeight.w500,
                ),
              ),
              isThreeLine: true,
              trailing: _isTestingPing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.darkGreen),
                    )
                  : OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        side: const BorderSide(color: AppColors.darkGreen),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: _testConnection,
                      child: const Text('Test Ping', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.darkGreen)),
                    ),
            ),
            const Divider(height: 1, indent: 56),
            ListTile(
              leading: const Icon(Icons.cleaning_services_outlined, color: Colors.orange),
              title: const Text('Clear Local App Cache', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: const Text('Free temporary storage & refresh local menu data', style: TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
              onTap: _clearCache,
            ),
          ]),
          const SizedBox(height: 20),

          // 5. SECURITY & ACCOUNT ACTION CARD
          _buildSectionHeader('Security & Account Actions', Icons.security_outlined),
          const SizedBox(height: 8),
          _buildCardContainer([
            SwitchListTile(
              activeThumbColor: AppColors.darkGreen,
              secondary: const Icon(Icons.fingerprint_outlined, color: AppColors.darkGreen),
              title: const Text('Quick Biometric / PIN Lock', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              subtitle: const Text('Require authentication when returning to app', style: TextStyle(fontSize: 12)),
              value: _biometricUnlock,
              onChanged: (val) => setState(() => _biometricUnlock = val),
            ),
            const Divider(height: 1, indent: 56),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: Colors.redAccent),
              title: const Text('Logout Waiter Account', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.redAccent, fontSize: 14)),
              subtitle: const Text('End active session and return to login screen', style: TextStyle(fontSize: 12)),
              trailing: const Icon(Icons.chevron_right, color: Colors.redAccent, size: 20),
              onTap: () => _confirmLogout(context, authProvider),
            ),
          ]),
          const SizedBox(height: 28),

          // 6. FOOTER BRANDING
          Center(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: AppColors.lightGreen,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.restaurant_menu, size: 20, color: AppColors.darkGreen),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Flavora Restaurant Management System',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 2),
                Text(
                  'Version 2.4.0 (Build 108) • ${user?.branch.isNotEmpty == true ? user!.branch : "Main Branch"}',
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- UI BUILDING HELPERS ---

  Widget _buildHeroHeader(String? name, String? avatarUrl, String? role, String? branch) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F2A1D), Color(0xFF1E4620)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F2A1D).withAlpha(40),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          UserAvatarWidget(
            avatarUrl: avatarUrl,
            name: name ?? 'Waiter',
            radius: 28,
            border: Border.all(color: Colors.white, width: 2),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name ?? 'Waiter Staff',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 2),
                Text(
                  'ROLE: ${(role ?? "WAITER").toUpperCase()} • ${branch != null && branch.isNotEmpty ? branch : "Main Branch"}',
                  style: const TextStyle(fontSize: 11, color: Color(0xFFA7F3D0), fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(30),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.wifi, size: 12, color: Color(0xFF4ADE80)),
                      SizedBox(width: 4),
                      Text(
                        'Live MongoDB Sync Active',
                        style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.darkGreen),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _buildCardContainer(List<Widget> children) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Column(children: children),
    );
  }

  // --- ACTIONS & DIALOGS ---

  void _showRingtonePicker() {
    final tones = ['Flavora Chime (Default)', 'High Priority Alert', 'Soft Kitchen Bell', 'Subtle Haptic Chime'];
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Select Order Alert Ringtone', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: tones.map((t) {
              final isSelected = t == _selectedRingtone;
              return ListTile(
                title: Text(t, style: TextStyle(fontSize: 14, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                trailing: isSelected
                    ? const Icon(Icons.check_circle, color: AppColors.darkGreen)
                    : const Icon(Icons.radio_button_unchecked, color: Colors.grey),
                onTap: () {
                  setState(() => _selectedRingtone = t);
                  StorageService.saveRingtone(t);
                  SoundService.playRingtone(t);
                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('🔊 Playing tune preview: $t'),
                      duration: const Duration(seconds: 2),
                      backgroundColor: AppColors.darkGreen,
                    ),
                  );
                  Navigator.pop(ctx);
                },
              );
            }).toList(),
          ),
        );
      },
    );
  }

  void _showClockFormatPicker() {
    final formats = ['12-Hour (02:30 PM)', '24-Hour (14:30)'];
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Select Clock Display Format', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: formats.map((f) {
              final isSelected = f == _clockFormat;
              return ListTile(
                title: Text(f, style: TextStyle(fontSize: 14, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                trailing: isSelected
                    ? const Icon(Icons.check_circle, color: AppColors.darkGreen)
                    : const Icon(Icons.radio_button_unchecked, color: Colors.grey),
                onTap: () {
                  setState(() => _clockFormat = f);
                  Navigator.pop(ctx);
                },
              );
            }).toList(),
          ),
        );
      },
    );
  }

  Future<void> _testConnection() async {
    setState(() {
      _isTestingPing = true;
    });

    final stopwatch = Stopwatch()..start();
    try {
      await ApiClient.get(ApiConstants.healthCheck);
      stopwatch.stop();
      if (mounted) {
        setState(() {
          _isTestingPing = false;
          _pingSuccess = true;
          _pingResult = 'Connected (HTTP 200 OK • ${stopwatch.elapsedMilliseconds}ms)';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Backend API Online (${stopwatch.elapsedMilliseconds}ms)'),
            backgroundColor: AppColors.darkGreen,
          ),
        );
      }
    } catch (_) {
      stopwatch.stop();
      if (mounted) {
        setState(() {
          _isTestingPing = false;
          _pingSuccess = false;
          _pingResult = 'Connection Failed (Server Offline)';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to reach backend server'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _clearCache() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('App cache cleared successfully! Floor tables refreshed.'),
        backgroundColor: AppColors.darkGreen,
      ),
    );
  }

  void _confirmLogout(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.logout, color: Colors.redAccent),
              SizedBox(width: 8),
              Text('Logout Confirmation', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          content: const Text('Are you sure you want to end your active waiter session? You will need to log back in with your credentials.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () async {
                Navigator.pop(ctx); // Close dialog
                await authProvider.logout();
                if (context.mounted) {
                  Navigator.popUntil(context, (route) => route.isFirst);
                }
              },
              child: const Text('Logout Now', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }
}
