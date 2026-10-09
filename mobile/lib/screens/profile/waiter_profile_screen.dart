import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/device_image_picker.dart';
import '../../core/utils/guest_guard.dart';
import '../../widgets/user_avatar_widget.dart';
import '../auth/login_screen.dart';
import '../settings/waiter_settings_screen.dart';

class WaiterProfileScreen extends StatelessWidget {
  const WaiterProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final isGuest = authProvider.isGuestMode;

    final phone = user?.phone ?? '';
    final empId = user?.empId ?? '';
    final userId = user?.id ?? '';
    final branch = user?.branch ?? '';
    final dept = user?.department ?? '';
    final shift = user?.scheduledShift ?? '';
    final isCheckedIn = user?.isCheckedIn ?? true;
    final status = user?.status ?? '';
    final assigned = user?.assignedTables ?? [];

    final nameStr = isGuest ? 'Guest Mode User' : (user?.name ?? 'Waiter Staff');
    final emailStr = isGuest ? 'guest@flavorakitchen.com' : (user?.email ?? 'No email');
    final phoneStr = isGuest ? 'Guest Session (Read-Only)' : (phone.isNotEmpty ? phone : 'Not Specified');
    final empIdStr = isGuest ? 'GUEST-MODE' : (empId.isNotEmpty ? empId : (userId.length >= 4 ? 'RMSW-${userId.substring(userId.length - 4).toUpperCase()}' : 'RMSW-01'));
    final roleStr = isGuest ? 'GUEST MODE' : (user?.role.toUpperCase() ?? 'WAITER');
    final branchStr = branch.isNotEmpty ? branch : 'Main Branch';
    final deptStr = dept.isNotEmpty ? dept : 'Floor Operations';
    final shiftStr = shift.isNotEmpty ? shift : 'General Shift';
    final statusStr = isGuest ? 'Limited Access' : (status.isNotEmpty ? status : 'Active');
    final attendanceStr = isGuest ? 'Disabled in Guest' : (isCheckedIn ? 'Present' : 'Checked Out');
    final attendanceColor = isGuest ? Colors.amber.shade800 : (isCheckedIn ? const Color(0xFF10B981) : const Color(0xFFEF4444));
    final hoursStr = isGuest ? 'N/A' : (user?.calculatedShiftHours ?? _calculateShiftHours(shiftStr, user?.hoursLogged));
    final tablesStr = assigned.isNotEmpty ? assigned.join(', ') : 'All Floor Tables (Read-Only)';

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit Profile Details',
            onPressed: () {
              if (GuestGuard.checkGuestRestriction(context, action: 'edit profile details')) return;
              _showEditProfileModal(context, authProvider);
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            tooltip: 'Shift Actions Dropdown',
            onSelected: (val) async {
              if (val == 'checkin') {
                if (GuestGuard.checkGuestRestriction(context, action: 'check in to shift')) return;
                final success = await authProvider.checkIn();
                if (context.mounted && success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('âœ“ Checked In for Shift successfully'), backgroundColor: AppColors.darkGreen),
                  );
                }
              } else if (val == 'checkout') {
                if (GuestGuard.checkGuestRestriction(context, action: 'check out of shift')) return;
                final success = await authProvider.checkOut();
                if (context.mounted && success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('âœ“ Checked Out of Shift successfully'), backgroundColor: Colors.amber),
                  );
                }
              } else if (val == 'settings') {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const WaiterSettingsScreen()));
              } else if (val == 'exit_guest') {
                authProvider.exitGuestMode();
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            itemBuilder: (ctx) {
              if (isGuest) {
                return [
                  const PopupMenuItem(
                    value: 'exit_guest',
                    child: Row(
                      children: [
                        Icon(Icons.logout_rounded, color: Color(0xFF0F4D3A), size: 20),
                        SizedBox(width: 10),
                        Text(
                          'Exit Guest Mode & Sign In',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F4D3A)),
                        ),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'settings',
                    child: Row(
                      children: [
                        Icon(Icons.settings_outlined, size: 20, color: AppColors.textPrimary),
                        SizedBox(width: 10),
                        Text('App Settings'),
                      ],
                    ),
                  ),
                ];
              }

              final isCheckedIn = user?.isCheckedIn ?? true;
              return [
                PopupMenuItem(
                  value: isCheckedIn ? 'checkout' : 'checkin',
                  child: Row(
                    children: [
                      Icon(
                        isCheckedIn ? Icons.timer_off_outlined : Icons.timer_outlined,
                        color: isCheckedIn ? Colors.amber.shade900 : AppColors.darkGreen,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        isCheckedIn ? 'Check Out of Shift' : 'Check In to Shift',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isCheckedIn ? Colors.amber.shade900 : AppColors.darkGreen,
                        ),
                      ),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'settings',
                  child: Row(
                    children: [
                      Icon(Icons.settings_outlined, size: 20, color: AppColors.textPrimary),
                      SizedBox(width: 10),
                      Text('App Settings'),
                    ],
                  ),
                ),
              ];
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User Header Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Interactive Avatar with Camera Badge
                    GestureDetector(
                      onTap: () {
                        if (GuestGuard.checkGuestRestriction(context, action: 'upload profile photo')) return;
                        _pickAndUploadPhoto(context, authProvider);
                      },
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          UserAvatarWidget(
                            avatarUrl: user?.avatarUrl,
                            name: nameStr,
                            radius: 44,
                            border: Border.all(color: AppColors.darkGreen, width: 2.5),
                          ),
                          if (!isGuest)
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: AppColors.darkGreen,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.camera_alt,
                                size: 16,
                                color: Colors.white,
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      nameStr,
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      emailStr,
                      style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Emp ID Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'EMP ID: $empIdStr',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Role Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: isGuest ? const Color(0xFFFFF0C7) : AppColors.lightGreen,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: isGuest ? const Color(0xFFFFE38E) : AppColors.availableBorder),
                          ),
                          child: Text(
                            'ROLE: $roleStr',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isGuest ? const Color(0xFFB45309) : AppColors.accentGreen),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Duty & Shift Information Card
            Card(
              elevation: 1.5,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.badge_outlined, color: AppColors.darkGreen, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Duty & Shift Status',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatusStat('Account Status', statusStr, Icons.verified_user, isGuest ? Colors.amber.shade900 : Colors.green),
                        _buildStatusStat('Attendance', attendanceStr, isGuest ? Icons.lock_clock_outlined : (isCheckedIn ? Icons.check_circle_outline : Icons.highlight_off_rounded), attendanceColor),
                        _buildStatusStat('Hours Logged', hoursStr, Icons.access_time_rounded, Colors.orange),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Profile Details Card
            Card(
              elevation: 1.5,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Column(
                children: [
                  _buildProfileTile(
                    Icons.phone_outlined,
                    'Contact Number',
                    phoneStr,
                    onTap: () {
                      if (GuestGuard.checkGuestRestriction(context, action: 'edit contact number')) return;
                      _showEditProfileModal(context, authProvider);
                    },
                  ),
                  const Divider(height: 1),
                  _buildProfileTile(Icons.storefront_outlined, 'Branch / Restaurant', branchStr),
                  const Divider(height: 1),
                  _buildProfileTile(Icons.corporate_fare_outlined, 'Department', deptStr),
                  const Divider(height: 1),
                  _buildProfileTile(Icons.schedule_outlined, 'Scheduled Shift', shiftStr),
                  const Divider(height: 1),
                  _buildProfileTile(Icons.table_restaurant_outlined, 'Assigned Floor Section', tablesStr),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Exit Guest Mode or Logout Waiter Account Button
            if (isGuest)
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F4D3A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: () {
                    authProvider.exitGuestMode();
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  },
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text(
                    'Exit Guest Mode & Sign In',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              )
            else
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    side: const BorderSide(color: Color(0xFFFCA5A5), width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: () async {
                    await authProvider.logout();
                    if (context.mounted) {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                        (route) => false,
                      );
                    }
                  },
                  icon: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444)),
                  label: const Text(
                    'Logout Account',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFFEF4444)),
                  ),
                ),
              ),
            const SizedBox(height: 28),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusStat(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  String _calculateShiftHours(String shiftStr, String? fallbackHours) {
    if (shiftStr.trim().isEmpty) {
      return (fallbackHours != null && fallbackHours.isNotEmpty) ? fallbackHours : '9h 00m';
    }

    final regExp = RegExp(r'(\d{1,2}):(\d{2})\s*(AM|PM)', caseSensitive: false);
    final matches = regExp.allMatches(shiftStr).toList();
    if (matches.length >= 2) {
      try {
        final m1 = matches[0];
        final m2 = matches[1];

        int h1 = int.parse(m1.group(1)!);
        int min1 = int.parse(m1.group(2)!);
        String p1 = m1.group(3)!.toUpperCase();

        int h2 = int.parse(m2.group(1)!);
        int min2 = int.parse(m2.group(2)!);
        String p2 = m2.group(3)!.toUpperCase();

        if (p1 == 'PM' && h1 < 12) h1 += 12;
        if (p1 == 'AM' && h1 == 12) h1 = 0;
        if (p2 == 'PM' && h2 < 12) h2 += 12;
        if (p2 == 'AM' && h2 == 12) h2 = 0;

        int totalMin1 = h1 * 60 + min1;
        int totalMin2 = h2 * 60 + min2;

        if (totalMin2 < totalMin1) {
          totalMin2 += 24 * 60;
        }

        int diff = totalMin2 - totalMin1;
        int hours = diff ~/ 60;
        int minutes = diff % 60;

        return '${hours}h ${minutes.toString().padLeft(2, '0')}m';
      } catch (_) {}
    }
    return (fallbackHours != null && fallbackHours.isNotEmpty) ? fallbackHours : '9h 00m';
  }

  Widget _buildProfileTile(IconData icon, String title, String subtitle, {VoidCallback? onTap}) {
    return ListTile(
      leading: Icon(icon, color: AppColors.darkGreen, size: 22),
      title: Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
      ),
      trailing: onTap != null ? const Icon(Icons.chevron_right, size: 20, color: AppColors.textSecondary) : null,
      onTap: onTap,
    );
  }

  void _showEditProfileModal(BuildContext context, AuthProvider authProvider) {
    final user = authProvider.user;
    final nameCtrl = TextEditingController(text: user?.name ?? '');
    final phoneCtrl = TextEditingController(text: user?.phone ?? '');
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Edit Profile Details',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Name Input
                    const Text('Full Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: nameCtrl,
                      decoration: InputDecoration(
                        hintText: 'Enter your full name',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Phone Input
                    const Text('Contact Number', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        hintText: '10-digit mobile number',
                        prefixText: '+91 ',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        counterText: '',
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Actions Row
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: () => Navigator.pop(ctx),
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.darkGreen,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: isSaving
                                ? null
                                : () async {
                                    final phoneVal = phoneCtrl.text.trim();
                                    if (phoneVal.isNotEmpty && phoneVal.length != 10) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Contact number must be exactly 10 digits.'),
                                          backgroundColor: Colors.red,
                                        ),
                                      );
                                      return;
                                    }

                                    setModalState(() => isSaving = true);
                                    final success = await authProvider.updateProfile({
                                      'name': nameCtrl.text.trim(),
                                      'phone': phoneVal,
                                    });
                                    setModalState(() => isSaving = false);

                                    if (ctx.mounted) {
                                      Navigator.pop(ctx);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            success
                                                ? 'Profile updated! Changes synced to MongoDB.'
                                                : (authProvider.errorMessage ?? 'Error updating profile'),
                                          ),
                                          backgroundColor: success ? AppColors.darkGreen : Colors.red,
                                        ),
                                      );
                                    }
                                  },
                            child: isSaving
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _pickAndUploadPhoto(BuildContext context, AuthProvider authProvider) async {
    try {
      final base64Image = await DeviceImagePicker.pickImage();
      if (base64Image != null && base64Image.isNotEmpty) {
        if (!context.mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                ),
                SizedBox(width: 12),
                Text('Uploading profile photo...'),
              ],
            ),
            duration: Duration(seconds: 2),
            backgroundColor: AppColors.darkGreen,
          ),
        );

        final success = await authProvider.updateProfile({
          'avatarUrl': base64Image.trim(),
        });

        if (!context.mounted) return;
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success
                  ? 'âœ“ Profile photo updated successfully!'
                  : (authProvider.errorMessage ?? 'Error saving profile photo'),
            ),
            backgroundColor: success ? AppColors.darkGreen : Colors.red,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick photo: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
