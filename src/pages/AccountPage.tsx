@@ .. @@
-'use client';
-
 import { useUser } from '@/contexts/UserContext';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
-import Link from 'next/link';
+import { Link } from 'react-router-dom';
 import { ArrowLeft, User as UserIcon, Bell, CreditCard, Shield, Crown, CheckCircle } from 'lucide-react';

export default Link