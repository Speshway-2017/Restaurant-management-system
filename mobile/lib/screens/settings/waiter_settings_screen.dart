import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class WaiterSettingsScreen extends StatefulWidget {
  const WaiterSettingsScreen({super.key});

  @override
  State<WaiterSettingsScreen> createState() => _WaiterSettingsScreenState();
}

class _WaiterSettingsScreenState extends State<WaiterSettingsScreen> {
  bool _soundNotifications = true;
  bool _autoRefreshTables = true;
  bool _vibrateOnOrderReady = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Waiter Application Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Notification & Alert Preferences',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  activeThumbColor: AppColors.accentGreen,
                  title: const Text('Sound Alerts on Order Ready', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Play chime when kitchen marks order ready'),
                  value: _soundNotifications,
                  onChanged: (val) => setState(() => _soundNotifications = val),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  activeThumbColor: AppColors.accentGreen,
                  title: const Text('Vibrate on New Table Call', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Vibrate phone when guest requests water or assistance'),
                  value: _vibrateOnOrderReady,
                  onChanged: (val) => setState(() => _vibrateOnOrderReady = val),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  activeThumbColor: AppColors.accentGreen,
                  title: const Text('Auto Refresh Tables & Orders', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Sync floor status every 5 seconds'),
                  value: _autoRefreshTables,
                  onChanged: (val) => setState(() => _autoRefreshTables = val),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Server Connection',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 8),
          const Card(
            child: ListTile(
              leading: Icon(Icons.dns, color: AppColors.darkGreen),
              title: Text('Backend API Server', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('http://localhost:5000/api (Connected)'),
              trailing: Icon(Icons.check_circle, color: AppColors.accentGreen, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}
