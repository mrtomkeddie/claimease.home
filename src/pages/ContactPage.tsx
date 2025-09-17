@@ .. @@
-'use client';
-
 import { useState } from 'react';
 import { TopMenu } from '@/components/TopMenu';
 import { Footer } from '@/components/Footer';
@@ .. @@
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Label } from '@/components/ui/label';
 import { Send } from 'lucide-react';
-import { poppins, gilroyHeavy } from '@/lib/fonts';

 interface ContactFormData {
 }
@@ .. @@
           {/* Header */}
           <div className="text-center mb-12">
-            <h1 className={`${gilroyHeavy.className} text-4xl md:text-5xl font-bold text-white mb-4`}>
+            <h1 className="font-gilroy-heavy text-4xl md:text-5xl font-bold text-white mb-4">
               Get in Touch
             </h1>
           </div>

           {/* Contact Form */}
           <Card className="shadow-lg">
             <CardHeader>
-              <CardTitle className={`${gilroyHeavy.className} text-2xl`}>Send us a Message</CardTitle>
+              <CardTitle className="font-gilroy-heavy text-2xl">Send us a Message</CardTitle>
               <CardDescription>