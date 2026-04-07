"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "success" | "error" | "info";
  message: string;
  data?: any;
}

export function WearableSimulatorClient() {
  const [deviceId, setDeviceId] = useState("TEST001");
  const [latitude, setLatitude] = useState("28.6139");
  const [longitude, setLongitude] = useState("77.2090");
  const [sosTriggered, setSosTriggered] = useState(false);
  const [fallDetected, setFallDetected] = useState(false);
  const [lowBattery, setLowBattery] = useState(false);
  const [isAutoPinging, setIsAutoPinging] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const autoPingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry["type"], message: string, data?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const sendPing = async (customLat?: number, customLng?: number) => {
    try {
      const lat = customLat ?? parseFloat(latitude);
      const lng = customLng ?? parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        addLog("error", "Invalid coordinates. Please enter valid numbers.");
        return;
      }

      const payload = {
        latitude: lat,
        longitude: lng,
        sos_triggered: sosTriggered,
        fall_detected: fallDetected,
        low_battery: lowBattery,
        battery_level: lowBattery ? 10 : 100,
      };

      addLog("info", `Sending ping for device: ${deviceId}`, payload);

      const response = await fetch(`/api/wearable/${encodeURIComponent(deviceId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addLog("success", "Ping sent successfully", result);
      } else {
        addLog("error", `Failed to send ping: ${result.error || "Unknown error"}`, result);
      }
    } catch (error) {
      addLog("error", `Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const startAutoPing = () => {
    if (isAutoPinging) {
      stopAutoPing();
      return;
    }

    setIsAutoPinging(true);
    addLog("info", "Starting auto-ping (every 5 seconds)");

    // Send first ping immediately
    sendPing();

    // Then send every 5 seconds with randomized coordinates
    autoPingIntervalRef.current = setInterval(() => {
      const baseLat = parseFloat(latitude);
      const baseLng = parseFloat(longitude);
      
      if (!isNaN(baseLat) && !isNaN(baseLng)) {
        // Add small random movement (±0.001 degrees ≈ ±100 meters)
        const randomLat = baseLat + (Math.random() - 0.5) * 0.002;
        const randomLng = baseLng + (Math.random() - 0.5) * 0.002;
        
        sendPing(randomLat, randomLng);
      } else {
        addLog("error", "Invalid base coordinates for auto-ping");
        stopAutoPing();
      }
    }, 5000);
  };

  const stopAutoPing = () => {
    if (autoPingIntervalRef.current) {
      clearInterval(autoPingIntervalRef.current);
      autoPingIntervalRef.current = null;
    }
    setIsAutoPinging(false);
    addLog("info", "Stopped auto-ping");
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    return () => {
      if (autoPingIntervalRef.current) {
        clearInterval(autoPingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wearable Simulator</h1>
        <p className="text-muted-foreground">
          Test wearable device functionality without physical hardware
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Device Configuration</CardTitle>
            <CardDescription>
              Configure the wearable device settings and location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID</Label>
              <Input
                id="deviceId"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Enter device ID"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="28.6139"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="77.2090"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Alert Triggers</Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sos">SOS Triggered</Label>
                  <p className="text-sm text-muted-foreground">
                    Emergency alert activation
                  </p>
                </div>
                <Switch
                  id="sos"
                  checked={sosTriggered}
                  onCheckedChange={setSosTriggered}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="fall">Fall Detected</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatic fall detection
                  </p>
                </div>
                <Switch
                  id="fall"
                  checked={fallDetected}
                  onCheckedChange={setFallDetected}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="battery">Low Battery (10%)</Label>
                  <p className="text-sm text-muted-foreground">
                    Battery level warning
                  </p>
                </div>
                <Switch
                  id="battery"
                  checked={lowBattery}
                  onCheckedChange={setLowBattery}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => sendPing()} className="flex-1">
                Send One Ping
              </Button>
              <Button
                onClick={startAutoPing}
                variant={isAutoPinging ? "destructive" : "outline"}
                className="flex-1"
              >
                {isAutoPinging ? "Stop Auto-Ping" : "Start Auto-Ping"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Response Log</CardTitle>
                <CardDescription>
                  Live server responses and activity
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">No activity yet...</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp}
                      </span>
                      <Badge
                        variant={
                          log.type === "success"
                            ? "default"
                            : log.type === "error"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {log.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-1">{log.message}</div>
                    {log.data && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          View data
                        </summary>
                        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Device ID:</strong> Enter the ID of the wearable device you want to simulate</p>
          <p>• <strong>Coordinates:</strong> Set the starting latitude and longitude (defaults to New Delhi)</p>
          <p>• <strong>Alert Triggers:</strong> Toggle switches to simulate different alert conditions</p>
          <p>• <strong>Send One Ping:</strong> Send a single location update to the server</p>
          <p>• <strong>Start Auto-Ping:</strong> Automatically send pings every 5 seconds with slight coordinate randomization to simulate movement</p>
          <p>• <strong>Response Log:</strong> View real-time server responses and debug information</p>
        </CardContent>
      </Card>
    </div>
  );
}
