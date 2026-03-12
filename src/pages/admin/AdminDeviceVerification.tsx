import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { lookupDeviceByIMEI, formatINR, getAllKnownTACs, type DeviceSpec } from '@/data/tacDatabase';
import { customerDevices } from '@/data/mockData';
import {
  ShieldCheck, ShieldAlert, ShieldX, Loader2, AlertTriangle,
  CheckCircle2, Smartphone, Cpu, HardDrive, Battery, Camera, Wifi,
  IndianRupee, Calendar, Ruler, Droplets, Fingerprint, Zap, Search,
  Monitor, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KPIMetric } from '@/types';
import StatsCard from '@/components/StatsCard';

type FraudRisk = 'clear' | 'warning' | 'blocked';

interface IMEIVerification {
  verified: boolean;
  status: FraudRisk;
  matchedDevice: typeof customerDevices[0] | null;
  deviceSpec: DeviceSpec | null;
  flags: string[];
}

const BLACKLISTED_IMEIS = ['000000000000000', '111111111111111'];
const SUSPICIOUS_PATTERNS = ['123456'];

const verifyIMEI = (imei: string): IMEIVerification => {
  const flags: string[] = [];

  if (!/^\d{15}$/.test(imei)) {
    return { verified: false, status: 'blocked', matchedDevice: null, deviceSpec: null, flags: ['Invalid IMEI format — must be exactly 15 digits'] };
  }

  const luhnCheck = (num: string): boolean => {
    let sum = 0;
    for (let i = 0; i < num.length; i++) {
      let digit = parseInt(num[i], 10);
      if (i % 2 === 1) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
    }
    return sum % 10 === 0;
  };

  if (!luhnCheck(imei)) {
    flags.push('IMEI fails Luhn checksum validation');
  }

  if (BLACKLISTED_IMEIS.includes(imei)) {
    return { verified: false, status: 'blocked', matchedDevice: null, deviceSpec: null, flags: ['IMEI is blacklisted — reported stolen or lost'] };
  }

  if (SUSPICIOUS_PATTERNS.some(p => imei.includes(p))) {
    flags.push('IMEI contains suspicious repeating pattern');
  }

  const deviceSpec = lookupDeviceByIMEI(imei);
  const matchedDevice = customerDevices.find(d => d.imei === imei);

  if (!matchedDevice) {
    flags.push('IMEI not found in registered customer devices');
  }

  if (matchedDevice?.status === 'expired') {
    flags.push('Device subscription has expired');
  }

  const status: FraudRisk = flags.length > 0 ? 'warning' : 'clear';
  return { verified: true, status, matchedDevice, deviceSpec, flags };
};

const SpecRow = ({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
    <Icon size={16} className="text-primary shrink-0 mt-0.5" />
    <div className="min-w-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-sm font-medium text-foreground leading-tight">{value}</p>
    </div>
  </div>
);

const AdminDeviceVerification = () => {
  const [imei, setImei] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<IMEIVerification | null>(null);

  const allTACs = getAllKnownTACs();
  const totalDevicesInDB = Object.keys(allTACs).length;
  const registeredDevices = customerDevices.length;

  const metrics: KPIMetric[] = [
    { label: 'Devices in TAC Database', value: totalDevicesInDB, trend: 'up', change: 12 },
    { label: 'Registered Customer Devices', value: registeredDevices, trend: 'stable', change: 0 },
    { label: 'Brands Covered', value: [...new Set(Object.values(allTACs).map(d => d.brand))].length, trend: 'up', change: 5 },
  ];

  const handleVerifyIMEI = useCallback(() => {
    setVerifying(true);
    setVerification(null);
    setTimeout(() => {
      const result = verifyIMEI(imei);
      setVerification(result);
      setVerifying(false);
    }, 1000);
  }, [imei]);

  const riskConfig = {
    clear: { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', label: 'IMEI Verified — No Issues Found' },
    warning: { icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'IMEI Verified — Warnings Detected' },
    blocked: { icon: ShieldX, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', label: 'Verification Failed' },
  };

  const spec = verification?.deviceSpec;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Device Verification</h1>
        <p className="text-muted-foreground mb-6">Verify device IMEI, view hardware specifications & Indian market pricing</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        {/* IMEI Lookup Section */}
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Search size={20} className="text-primary" />
              IMEI Lookup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Enter 15-digit IMEI number (e.g., 863420062953019)"
                value={imei}
                onChange={e => { setImei(e.target.value.replace(/\D/g, '').slice(0, 15)); setVerification(null); }}
                maxLength={15}
                className="font-mono text-base"
              />
              <Button onClick={handleVerifyIMEI} disabled={imei.length !== 15 || verifying} className="shrink-0 px-6">
                {verifying ? <Loader2 size={16} className="animate-spin mr-2" /> : <ShieldCheck size={16} className="mr-2" />}
                Verify Device
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Enter the device IMEI to fetch complete hardware specifications, fraud checks, and Indian market valuation.</p>

            {/* Verification Result */}
            <AnimatePresence>
              {verification && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  {(() => {
                    const config = riskConfig[verification.status];
                    const Icon = config.icon;
                    return (
                      <Alert className={`${config.bg} ${config.border} border`}>
                        <Icon size={18} className={config.color} />
                        <AlertTitle className={`${config.color} font-semibold`}>{config.label}</AlertTitle>
                        <AlertDescription>
                          {verification.matchedDevice && (
                            <div className="mt-2 p-3 rounded-lg bg-background/60 text-sm space-y-1">
                              <p><span className="text-muted-foreground">Registered Device:</span> <span className="font-medium">{verification.matchedDevice.brand} {verification.matchedDevice.model}</span></p>
                              <p><span className="text-muted-foreground">Customer ID:</span> <span className="font-mono">{verification.matchedDevice.customerId}</span></p>
                              <p><span className="text-muted-foreground">Plan:</span> {verification.matchedDevice.subscriptionPlanId === 'sp2' ? 'WaaZ+ Complete Care' : 'WaaZ Standard Care'}</p>
                              <p><span className="text-muted-foreground">Status:</span> <span className={verification.matchedDevice.status === 'active' ? 'text-success font-medium' : 'text-destructive font-medium'}>{verification.matchedDevice.status.toUpperCase()}</span></p>
                              <p><span className="text-muted-foreground">Subscription:</span> {verification.matchedDevice.subscriptionStart} → {verification.matchedDevice.subscriptionEnd}</p>
                            </div>
                          )}
                          {verification.flags.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {verification.flags.map((flag, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                                  <span>{flag}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {verification.status === 'clear' && (
                            <div className="flex items-center gap-1.5 mt-2 text-sm text-success">
                              <CheckCircle2 size={14} /> All fraud checks passed — device is clean
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Full Device Specifications */}
        <AnimatePresence>
          {spec && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="shadow-card mb-6 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Smartphone size={28} className="text-primary" />
                      </div>
                      <div>
                        <CardTitle className="font-heading text-xl">{spec.brand} {spec.marketName}</CardTitle>
                        <p className="text-sm text-muted-foreground">Model: {spec.model} · {spec.deviceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={16} />
                      <span>Released {new Date(spec.releaseDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hardware Specifications */}
                  <div>
                    <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
                      <Monitor size={16} className="text-primary" />
                      Hardware Specifications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <SpecRow icon={Cpu} label="Processor" value={spec.specs.processor} />
                      <SpecRow icon={HardDrive} label="RAM" value={spec.specs.ram} />
                      <SpecRow icon={HardDrive} label="Storage" value={spec.specs.storage} />
                      <SpecRow icon={Smartphone} label="Display" value={spec.specs.display} />
                      <SpecRow icon={Battery} label="Battery" value={spec.specs.battery} />
                      <SpecRow icon={Camera} label="Rear Camera" value={spec.specs.rearCamera} />
                      <SpecRow icon={Camera} label="Front Camera" value={spec.specs.frontCamera} />
                      <SpecRow icon={Wifi} label="Connectivity" value={spec.specs.connectivity} />
                      <SpecRow icon={Smartphone} label="Operating System" value={spec.specs.os} />
                      <SpecRow icon={Ruler} label="Dimensions" value={`${spec.specs.dimensions} · ${spec.specs.weight}`} />
                      {spec.specs.chargingSpeed && <SpecRow icon={Zap} label="Charging" value={spec.specs.chargingSpeed} />}
                      {spec.specs.waterResistance && <SpecRow icon={Droplets} label="Water Resistance" value={spec.specs.waterResistance} />}
                      {spec.specs.biometrics && <SpecRow icon={Fingerprint} label="Biometrics" value={spec.specs.biometrics} />}
                    </div>
                  </div>

                  <Separator />

                  {/* Indian Market Valuation */}
                  <div>
                    <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
                      <IndianRupee size={16} className="text-primary" />
                      Indian Market Valuation
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="rounded-xl bg-muted/40 p-4 text-center border border-border">
                        <p className="text-xs text-muted-foreground mb-1">MRP (Launch Price)</p>
                        <p className="text-xl font-bold text-foreground">{formatINR(spec.estimatedPriceINR.mrp)}</p>
                      </div>
                      <div className="rounded-xl bg-primary/5 p-4 text-center border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">Current Market Price</p>
                        <p className="text-xl font-bold text-primary">{formatINR(spec.estimatedPriceINR.currentMarket)}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-4 text-center border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Repair Cost (Min)</p>
                        <p className="text-xl font-bold text-foreground">{formatINR(spec.estimatedPriceINR.repairCostRange.min)}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-4 text-center border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Repair Cost (Max)</p>
                        <p className="text-xl font-bold text-foreground">{formatINR(spec.estimatedPriceINR.repairCostRange.max)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Depreciation Info */}
                  <div className="rounded-xl bg-warning/5 border border-warning/20 p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Depreciation Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price Drop</span>
                        <p className="font-bold text-foreground">{formatINR(spec.estimatedPriceINR.mrp - spec.estimatedPriceINR.currentMarket)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Depreciation %</span>
                        <p className="font-bold text-destructive">{((1 - spec.estimatedPriceINR.currentMarket / spec.estimatedPriceINR.mrp) * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Coverage Value</span>
                        <p className="font-bold text-primary">{formatINR(spec.estimatedPriceINR.currentMarket)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Device not found in DB */}
        <AnimatePresence>
          {verification && !spec && verification.status !== 'blocked' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="shadow-card mb-6 border-warning/20">
                <CardContent className="p-6 text-center">
                  <Database size={40} className="text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-heading font-semibold mb-1">Device Not in TAC Database</h3>
                  <p className="text-sm text-muted-foreground">This IMEI's TAC prefix ({imei.substring(0, 8)}) is not in the local database. The IMEI format is valid but device specifications are unavailable.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Known Devices Reference Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Database size={20} className="text-primary" />
              TAC Database Reference ({totalDevicesInDB} devices)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>TAC Prefix</TableHead>
                  <TableHead>Release</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Market Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(allTACs).map(([tac, device]) => (
                  <TableRow key={tac} className="cursor-pointer hover:bg-muted/50" onClick={() => { setImei(tac + '0000000'); }}>
                    <TableCell className="font-medium">{device.brand}</TableCell>
                    <TableCell>{device.marketName}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{tac}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(device.releaseDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell>{formatINR(device.estimatedPriceINR.mrp)}</TableCell>
                    <TableCell className="text-primary font-medium">{formatINR(device.estimatedPriceINR.currentMarket)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDeviceVerification;
