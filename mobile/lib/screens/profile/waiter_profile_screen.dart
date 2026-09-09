import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/user_avatar_widget.dart';
import '../settings/waiter_settings_screen.dart';

class WaiterProfileScreen extends StatelessWidget {
  const WaiterProfileScreen({super.key});

  static const List<Map<String, String>> _presetAvatars = [
    {
      'label': 'Waiter Male 1',
      'url': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80',
    },
    {
      'label': 'Waiter Female 1',
      'url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    },
    {
      'label': 'Waiter Male 2',
      'url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    },
    {
      'label': 'Waiter Female 2',
      'url': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
    },
    {
      'label': 'Head Staff',
      'url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    },
    {
      'label': 'Executive Chef',
      'url': 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=250&q=80',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    final nameStr = user?.name ?? 'Waiter Staff';
    final phoneStr = user?.phone.isNotEmpty == true ? user!.phone : '+91 98765 43210';
    final empIdStr = user?.empId.isNotEmpty == true ? user!.empId : 'RMSW-01';
    final branchStr = user?.branch.isNotEmpty == true ? user!.branch : 'Jubilee Hills (Main Branch)';
    final deptStr = user?.department.isNotEmpty == true ? user!.department : 'Operations & Floor Management';
    final shiftStr = user?.scheduledShift.isNotEmpty == true ? user!.scheduledShift : '09:00 AM – 06:00 PM (Morning)';
    final statusStr = user?.status.isNotEmpty == true ? user!.status : 'Active';
    final attendanceStr = user?.attendanceStatus.isNotEmpty == true ? user!.attendanceStatus : 'Present';
    final hoursStr = user?.hoursLogged.isNotEmpty == true ? user!.hoursLogged : '8h 30m';
    final tablesStr = user?.assignedTables.isNotEmpty == true ? user!.assignedTables.join(', ') : 'All Floor Tables (Auto-Sync)';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Waiter Profile & Shift Info'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit Profile Details',
            onPressed: () => _showEditProfileModal(context, authProvider),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'App Settings',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const WaiterSettingsScreen()),
              );
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
                      onTap: () => _showPhotoUploadModal(context, authProvider),
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          UserAvatarWidget(
                            avatarUrl: user?.avatarUrl,
                            name: nameStr,
                            radius: 44,
                            border: Border.all(color: AppColors.darkGreen, width: 2.5),
                          ),
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
                      user?.email ?? '',
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
                            color: AppColors.lightGreen,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.availableBorder),
                          ),
                          child: Text(
                            'ROLE: ${user?.role.toUpperCase() ?? "WAITER"}',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.accentGreen),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.darkGreen,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          ),
                          onPressed: () => _showPhotoUploadModal(context, authProvider),
                          icon: const Icon(Icons.add_a_photo, size: 16),
                          label: const Text('Change Photo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.darkGreen,
                            side: const BorderSide(color: AppColors.darkGreen),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          ),
                          onPressed: () => _showEditProfileModal(context, authProvider),
                          icon: const Icon(Icons.edit, size: 16),
                          label: const Text('Edit Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
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
                          'Duty & Shift Status (Database Live Sync)',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatusStat('Account Status', statusStr, Icons.verified_user, Colors.green),
                        _buildStatusStat('Attendance', attendanceStr, Icons.check_circle_outline, const Color(0xFF10B981)),
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
                  _buildProfileTile(Icons.phone_outlined, 'Phone Contact', phoneStr),
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
            const SizedBox(height: 28),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                text: 'Logout from Waiter Account',
                icon: Icons.logout,
                backgroundColor: AppColors.cancelledText,
                onPressed: () async {
                  await authProvider.logout();
                },
              ),
            ),
            const SizedBox(height: 16),
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

  Widget _buildProfileTile(IconData icon, String title, String subtitle) {
    return ListTile(
      leading: Icon(icon, color: AppColors.darkGreen),
      title: Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
    );
  }

  void _showEditProfileModal(BuildContext context, AuthProvider authProvider) {
    final user = authProvider.user;
    final nameCtrl = TextEditingController(text: user?.name ?? '');
    final phoneCtrl = TextEditingController(text: user?.phone ?? '');
    final branchCtrl = TextEditingController(text: user?.branch ?? '');
    final deptCtrl = TextEditingController(text: user?.department ?? '');
    final shiftCtrl = TextEditingController(text: user?.scheduledShift ?? '');

    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Row(
                      children: [
                        Icon(Icons.edit_note, color: AppColors.darkGreen, size: 26),
                        SizedBox(width: 8),
                        Text(
                          'Edit Profile Details',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Changes will immediately update in MongoDB and reflect on both Web & Mobile.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 20),

                    // Full Name Input
                    const Text('Full Name', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: nameCtrl,
                      decoration: InputDecoration(
                        hintText: 'Enter full name',
                        prefixIcon: const Icon(Icons.person_outline, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Phone Contact Input
                    const Text('Phone Number', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        hintText: 'Enter mobile number',
                        prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Branch Input
                    const Text('Branch / Restaurant Location', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: branchCtrl,
                      decoration: InputDecoration(
                        hintText: 'Enter branch location',
                        prefixIcon: const Icon(Icons.storefront_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Department Input
                    const Text('Department', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: deptCtrl,
                      decoration: InputDecoration(
                        hintText: 'Enter department name',
                        prefixIcon: const Icon(Icons.corporate_fare_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Scheduled Shift Input
                    const Text('Scheduled Shift', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: shiftCtrl,
                      decoration: InputDecoration(
                        hintText: 'e.g. 09:00 AM – 06:00 PM (Morning)',
                        prefixIcon: const Icon(Icons.schedule_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: isSaving ? null : () => Navigator.pop(ctx),
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
                                    setModalState(() => isSaving = true);
                                    final success = await authProvider.updateProfile({
                                      'name': nameCtrl.text.trim(),
                                      'phone': phoneCtrl.text.trim(),
                                      'branch': branchCtrl.text.trim(),
                                      'department': deptCtrl.text.trim(),
                                      'scheduledShift': shiftCtrl.text.trim(),
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
                                : const Text('Save & Sync Changes', style: TextStyle(fontWeight: FontWeight.bold)),
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

  void _showPhotoUploadModal(BuildContext context, AuthProvider authProvider) {
    final user = authProvider.user;
    final urlCtrl = TextEditingController(text: user?.avatarUrl ?? '');
    String selectedUrl = user?.avatarUrl ?? '';
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Row(
                      children: [
                        Icon(Icons.add_a_photo_outlined, color: AppColors.darkGreen, size: 26),
                        SizedBox(width: 8),
                        Text(
                          'Upload Profile Photo',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Choose a staff avatar or enter an image URL / base64 photo for your waiter profile.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 20),

                    // Live Preview Container
                    Center(
                      child: Column(
                        children: [
                          UserAvatarWidget(
                            avatarUrl: selectedUrl,
                            name: user?.name ?? 'Waiter',
                            radius: 46,
                            border: Border.all(color: AppColors.darkGreen, width: 3),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Live Photo Preview',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Preset Avatars Section
                    const Text(
                      'Select Preset Avatar',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 84,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _presetAvatars.length,
                        itemBuilder: (context, idx) {
                          final avatar = _presetAvatars[idx];
                          final isSelected = selectedUrl == avatar['url'];
                          return GestureDetector(
                            onTap: () {
                              setModalState(() {
                                selectedUrl = avatar['url']!;
                                urlCtrl.text = avatar['url']!;
                              });
                            },
                            child: Container(
                              margin: const EdgeInsets.only(right: 12),
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected ? AppColors.darkGreen : Colors.transparent,
                                  width: 3,
                                ),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircleAvatar(
                                    radius: 26,
                                    backgroundImage: NetworkImage(avatar['url']!),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    avatar['label']!,
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      color: isSelected ? AppColors.darkGreen : AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Custom URL / Base64 Input
                    const Text(
                      'Or Paste Photo URL / Image Data',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: urlCtrl,
                      onChanged: (val) {
                        setModalState(() {
                          selectedUrl = val.trim();
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'https://example.com/waiter-photo.jpg',
                        prefixIcon: const Icon(Icons.link_outlined, size: 20),
                        suffixIcon: urlCtrl.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  setModalState(() {
                                    urlCtrl.clear();
                                    selectedUrl = '';
                                  });
                                },
                              )
                            : null,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: isSaving ? null : () => Navigator.pop(ctx),
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
                                    setModalState(() => isSaving = true);
                                    final success = await authProvider.updateProfile({
                                      'avatarUrl': selectedUrl.trim(),
                                    });
                                    setModalState(() => isSaving = false);

                                    if (ctx.mounted) {
                                      Navigator.pop(ctx);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            success
                                                ? 'Profile photo updated! Synced to MongoDB.'
                                                : (authProvider.errorMessage ?? 'Error saving profile photo'),
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
                                : const Text('Save Photo', style: TextStyle(fontWeight: FontWeight.bold)),
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
}

