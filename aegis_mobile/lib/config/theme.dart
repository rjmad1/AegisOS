import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AegisTheme {
  AegisTheme._();

  // Dark obsidian colors mapped to Material 3 palette Scheme
  static const Color darkCanvas = Color(0xFF060814);
  static const Color darkSurface = Color(0xFF0E1329);
  static const Color electricIndigo = Color(0xFF6B5DFF);
  static const Color cyberCyan = Color(0xFF3DF2FF);
  static const Color subBorder = Color(0xFF282D47);
  static const Color textPrimary = Color(0xFFF5F7FA);
  static const Color textMuted = Color(0xFF9CA3AF);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkCanvas,
      primaryColor: electricIndigo,
      colorScheme: const ColorScheme.dark(
        primary: electricIndigo,
        secondary: cyberCyan,
        surface: darkSurface,
        background: darkCanvas,
        outline: subBorder,
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.outfit(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: textPrimary,
        ),
        titleMedium: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        bodyMedium: GoogleFonts.outfit(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: textPrimary,
        ),
        bodySmall: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: textMuted,
        ),
      ),
    );
  }
}
