package com.finmate;

/**
 * Standard Java Application Launcher
 * Bypasses JavaFX runtime launcher checks when packaged as a FAT jar
 */
public class Main {
    public static void main(String[] args) {
        FinmateApp.main(args);
    }
}
