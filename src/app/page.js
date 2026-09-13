"use client";
import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

export default function Home() {
  const [status, setStatus] = useState("");
  const [whatsappTo, setWhatsappTo] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [pushStatus, setPushStatus] = useState("Not subscribed");

  useEffect(() => {
    if (window.__oneSignalInitStarted) return;
    window.__oneSignalInitStarted = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
      });
      const id = OneSignal.User.PushSubscription.id;
      if (id) {
        window.__oneSignalSubId = id;
        setPushStatus("Subscribed: " + id);
      }
      OneSignal.User.PushSubscription.addEventListener("change", (event) => {
        if (event.current.id) {
          window.__oneSignalSubId = event.current.id;
          setPushStatus("Subscribed: " + event.current.id);
        }
      });
    });
  }, []);

  async function subscribeToPush() {
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.Notifications.requestPermission();
      });
    }
  }

  async function fireTrigger(triggerCode) {
    setStatus(`Firing "${triggerCode}"...`);
    try {
      const res = await fetch(`${API_BASE}/api/fire/${triggerCode}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_to: whatsappTo || undefined,
          email_to: emailTo || undefined,
          push_subscription_id: window.__oneSignalSubId || undefined,
        }),
      });
      const data = await res.json();
      setStatus(JSON.stringify(data, null, 2));
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-gray-50">
      <h1 className="text-2xl font-bold">Notification System — Demo Site</h1>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <input
          className="border rounded px-3 py-2"
          placeholder="WhatsApp number (e.g. 91XXXXXXXXXX)"
          value={whatsappTo}
          onChange={(e) => setWhatsappTo(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Email address"
          value={emailTo}
          onChange={(e) => setEmailTo(e.target.value)}
        />
        <button
          onClick={subscribeToPush}
          className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700"
        >
          Enable Web Push
        </button>
        <p className="text-xs text-gray-500">{pushStatus}</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => fireTrigger("login")}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          Simulate Login
        </button>
        <button
          onClick={() => fireTrigger("logout")}
          className="bg-gray-700 text-white px-5 py-2 rounded hover:bg-gray-800"
        >
          Simulate Logout
        </button>
      </div>

      <pre className="bg-white border rounded p-4 w-full max-w-lg text-xs overflow-auto">
        {status}
      </pre>
    </div>
  );
}
