package com.khamarpro.app;

import android.app.Dialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.os.Message;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                settings.setSupportMultipleWindows(true);

                // Sanitize User-Agent so Google OAuth allows login without 403 disallowed_useragent
                String ua = settings.getUserAgentString();
                if (ua != null) {
                    String cleanUa = ua.replace("; wv", "").replaceAll("Version/[0-9.]+\\s?", "");
                    settings.setUserAgentString(cleanUa);
                }

                CookieManager cookieManager = CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);

                // WebChromeClient with onCreateWindow to handle Google Popup Authentication smoothly
                final WebChromeClient previousChromeClient = webView.getWebChromeClient();
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                        try {
                            WebView popupWebView = new WebView(MainActivity.this);
                            WebSettings popupSettings = popupWebView.getSettings();
                            popupSettings.setJavaScriptEnabled(true);
                            popupSettings.setDomStorageEnabled(true);
                            popupSettings.setDatabaseEnabled(true);
                            popupSettings.setSupportMultipleWindows(true);
                            popupSettings.setJavaScriptCanOpenWindowsAutomatically(true);

                            String popupUa = popupSettings.getUserAgentString();
                            if (popupUa != null) {
                                String cleanPopupUa = popupUa.replace("; wv", "").replaceAll("Version/[0-9.]+\\s?", "");
                                popupSettings.setUserAgentString(cleanPopupUa);
                            }

                            CookieManager popupCookieManager = CookieManager.getInstance();
                            popupCookieManager.setAcceptCookie(true);
                            popupCookieManager.setAcceptThirdPartyCookies(popupWebView, true);

                            Dialog popupDialog = new Dialog(MainActivity.this, android.R.style.Theme_DeviceDefault_Light_NoActionBar_Fullscreen);
                            popupDialog.setContentView(popupWebView, new ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            ));

                            popupWebView.setWebChromeClient(new WebChromeClient() {
                                @Override
                                public void onCloseWindow(WebView window) {
                                    try {
                                        popupDialog.dismiss();
                                        window.destroy();
                                    } catch (Exception ignored) {}
                                }
                            });

                            popupWebView.setWebViewClient(new WebViewClient() {
                                @Override
                                public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                                    return false;
                                }
                            });

                            popupDialog.setOnCancelListener(new DialogInterface.OnCancelListener() {
                                @Override
                                public void onCancel(DialogInterface dialog) {
                                    try {
                                        popupWebView.destroy();
                                    } catch (Exception ignored) {}
                                }
                            });

                            popupDialog.show();

                            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                            transport.setWebView(popupWebView);
                            resultMsg.sendToTarget();
                            return true;
                        } catch (Exception e) {
                            return false;
                        }
                    }

                    @Override
                    public boolean onShowFileChooser(WebView wv, ValueCallback<android.net.Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                        if (previousChromeClient != null) {
                            return previousChromeClient.onShowFileChooser(wv, filePathCallback, fileChooserParams);
                        }
                        return super.onShowFileChooser(wv, filePathCallback, fileChooserParams);
                    }

                    @Override
                    public void onPermissionRequest(android.webkit.PermissionRequest request) {
                        if (previousChromeClient != null) {
                            previousChromeClient.onPermissionRequest(request);
                        } else {
                            super.onPermissionRequest(request);
                        }
                    }

                    @Override
                    public void onGeolocationPermissionsShowPrompt(String origin, android.webkit.GeolocationPermissions.Callback callback) {
                        if (previousChromeClient != null) {
                            previousChromeClient.onGeolocationPermissionsShowPrompt(origin, callback);
                        } else {
                            super.onGeolocationPermissionsShowPrompt(origin, callback);
                        }
                    }
                });
            }
        } catch (Exception ignored) {}
    }
}


