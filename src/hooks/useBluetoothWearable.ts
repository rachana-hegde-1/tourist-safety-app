"use client";

import { useCallback, useState } from "react";

// Replace these with your wearable's actual BLE service and characteristic UUIDs.
const WEARABLE_SERVICE_UUID = "00001234-0000-1000-8000-00805f9b34fb";
const DEVICE_ID_CHARACTERISTIC_UUID = "00005678-0000-1000-8000-00805f9b34fb";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BluetoothDeviceLike = any;

export function useBluetoothWearable() {
  const [bleDevice, setBleDevice] = useState<BluetoothDeviceLike | null>(null);
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  const [bleConnected, setBleConnected] = useState(false);
  const [bleStatus, setBleStatus] = useState<
    "idle" | "scanning" | "connecting" | "connected" | "error"
  >("idle");
  const [bleError, setBleError] = useState<string | null>(null);

  const bleSupported =
    typeof navigator !== "undefined" &&
    "bluetooth" in navigator &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (navigator as any).bluetooth?.requestDevice === "function";

  const connectWearable = useCallback(async () => {
    setBleError(null);

    if (!bleSupported) {
      throw new Error("Web Bluetooth is not supported in this browser.");
    }

    setBleStatus("scanning");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [WEARABLE_SERVICE_UUID],
      });

      setBleDeviceName(device.name || device.id || "Unknown wearable");
      setBleDevice(device);
      setBleStatus("connecting");

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error("Unable to connect to wearable GATT server.");
      }

      const service = await server.getPrimaryService(WEARABLE_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(DEVICE_ID_CHARACTERISTIC_UUID);
      const value = await characteristic.readValue();
      const decoder = new TextDecoder("utf-8");
      const deviceId = decoder.decode(value).trim();

      setBleConnected(true);
      setBleStatus("connected");

      device.addEventListener("gattserverdisconnected", () => {
        setBleConnected(false);
        setBleStatus("idle");
      });

      return deviceId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bluetooth connection failed.";
      setBleError(message);
      setBleStatus("error");
      console.error("BLE wearable connection failed:", error);
      throw error;
    }
  }, [bleSupported]);

  const disconnectWearable = useCallback(async () => {
    if (bleDevice?.gatt?.connected) {
      bleDevice.gatt.disconnect();
    }
    setBleConnected(false);
    setBleDevice(null);
    setBleDeviceName(null);
    setBleStatus("idle");
    setBleError(null);
  }, [bleDevice]);

  return {
    bleSupported,
    bleDevice,
    bleDeviceName,
    bleConnected,
    bleStatus,
    bleError,
    connectWearable,
    disconnectWearable,
  };
}
