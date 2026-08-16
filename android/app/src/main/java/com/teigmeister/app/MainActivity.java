package com.teigmeister.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

/*
 * Play-Store-Backlog C3 (Android-Feinschliff, Statusleiste): das in @capacitor/core
 * gebündelte "SystemBars"-Plugin (js/theme.js, PZ.setTheme()/applyTheme()) stellt bereits
 * die Icon-/Text-Farbe der System-Leisten passend zum App-Theme ein, unterstützt laut
 * eigener Doku (node_modules/@capacitor/core/system-bars.md) aber bewusst KEIN
 * setBackgroundColor() mehr -- das Edge-to-Edge-Design geht davon aus, dass die Leisten
 * transparent sind und der eigene Seiteninhalt durchscheint. Das setzt eine WebView-Version
 * ab Chromium 140 voraus (s. Kommentar in node_modules/@capacitor/android/.../SystemBars.java,
 * WEBVIEW_VERSION_WITH_SAFE_AREA_FIX). Auf älteren WebView-Ständen (auf dem
 * Teigmeister_Test-Emulator z. B. Version 113, Android 14) bleibt die Leiste stattdessen
 * eine vom Seiteninhalt unabhängige, IMMER gleich eingefärbte Fläche -- live per Screenshot
 * bestätigt: ohne diese Ergänzung blieb sie dauerhaft schwarz (Fensterhintergrund der
 * Splash-/Launch-Theme, s. AndroidManifest.xml), wodurch die (korrekt gesetzten) dunklen
 * Icons im Hellmodus unsichtbar wurden.
 *
 * Deshalb hier zusätzlich eine minimale eigene JS-Brücke ("TeigmeisterNativeBars",
 * registriert nach demselben addJavascriptInterface()-Muster wie SystemBars.java selbst),
 * die die klassische Window.setStatusBarColor()/setNavigationBarColor()-API direkt setzt.
 * Diese API ist auf Android-Versionen ohne erzwungenes Edge-to-Edge (< 15, bzw. mit
 * Opt-out) weiterhin wirksam; auf Android 15+ mit erzwungenem Edge-to-Edge ignoriert das
 * System die Aufrufe dokumentiert folgenlos -- dort greift stattdessen die transparente
 * SystemBars-Leiste, sobald die WebView-Komponente automatisch auf >=140 aktualisiert.
 * Kein Ersatz für SystemBars (Icon-Farbe bleibt dessen Aufgabe), nur eine Ergänzung für den
 * Hintergrund auf älteren WebView-Ständen.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        addNativeBarsBridge();
    }

    private void addNativeBarsBridge() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void setBarColor(final String hex) {
                runOnUiThread(() -> {
                    try {
                        int color = Color.parseColor(hex);
                        Window window = getWindow();
                        window.setStatusBarColor(color);
                        window.setNavigationBarColor(color);
                    } catch (Exception e) {
                        // Ungültiger Hex-Wert oder Fenster nicht mehr verfügbar -- kein
                        // Absturz, die Leiste behält einfach ihre vorherige Farbe.
                    }
                });
            }
        }, "TeigmeisterNativeBars");
    }
}
