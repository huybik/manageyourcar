/* /client/src/pages/settings.tsx */
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("account");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [mobileNotifications, setMobileNotifications] = useState(true);
  const [maintenanceReminders, setMaintenanceReminders] = useState(true);
  const [inventoryAlerts, setInventoryAlerts] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  useEffect(() => {
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    toast({
      title: t("settings.languageUpdated"),
    });
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated", // Keep this in English or add to translation
      description: "Your profile has been updated successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification settings updated", // Keep this in English or add to translation
      description: "Your notification preferences have been saved.",
    });
  };

  const handleSavePassword = () => {
    toast({
      title: "Password updated", // Keep this in English or add to translation
      description: "Your password has been changed successfully.",
    });
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("settings.title")}
        </h1>
        <p className="text-gray-500">{t("settings.description")}</p>
      </div>

      {/* Settings Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="border-b w-full justify-start rounded-none p-0 h-auto">
          <TabsTrigger
            value="account"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
          >
            {t("settings.accountProfile")}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
          >
            {t("settings.notifications")}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
          >
            {t("settings.security")}
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
          >
            {t("settings.preferences")}
          </TabsTrigger>
        </TabsList>

        {/* Account Profile Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.personalInfo")}</CardTitle>
              <CardDescription>
                {t("settings.personalInfoDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="material-icons text-5xl text-gray-400">
                      person
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {(user?.role || "").replace("_", " ")}
                  </p>
                  <Button variant="outline" size="sm">
                    <span className="material-icons text-sm mr-1">
                      photo_camera
                    </span>
                    {t("settings.changePhoto")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("settings.fullName")}</Label>
                  <Input id="name" defaultValue={user?.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t("settings.username")}</Label>
                  <Input id="username" defaultValue={user?.username} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("settings.emailAddress")}</Label>
                  <Input id="email" type="email" defaultValue={user?.email} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("settings.phoneNumber")}</Label>
                  <Input id="phone" defaultValue={user?.phone} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveProfile}>
                {t("settings.saveChanges")}
              </Button>
            </CardFooter>
          </Card>

          {/* Role-specific settings */}
          {user?.role === "driver" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.driverInfo")}</CardTitle>
                <CardDescription>
                  {t("settings.driverInfoDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license">
                      {t("settings.driversLicense")}
                    </Label>
                    <Input
                      id="license"
                      placeholder={t("settings.licensePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiration">
                      {t("settings.licenseExpiration")}
                    </Label>
                    <Input id="expiration" type="date" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveProfile}>
                  {t("settings.saveChanges")}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notificationPreferences")}</CardTitle>
              <CardDescription>
                {t("settings.notificationPreferencesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">
                  {t("settings.deliveryMethods")}
                </h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">
                      {t("settings.emailNotifications")}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {t("settings.emailNotificationsDesc")}
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mobile-notifications">
                      {t("settings.mobileNotifications")}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {t("settings.mobileNotificationsDesc")}
                    </p>
                  </div>
                  <Switch
                    id="mobile-notifications"
                    checked={mobileNotifications}
                    onCheckedChange={setMobileNotifications}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900">
                  {t("settings.notificationTypes")}
                </h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-reminders">
                      {t("settings.maintenanceReminders")}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {t("settings.maintenanceRemindersDesc")}
                    </p>
                  </div>
                  <Switch
                    id="maintenance-reminders"
                    checked={maintenanceReminders}
                    onCheckedChange={setMaintenanceReminders}
                  />
                </div>

                {user?.role === "company_admin" && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="inventory-alerts">
                        {t("settings.inventoryAlerts")}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t("settings.inventoryAlertsDesc")}
                      </p>
                    </div>
                    <Switch
                      id="inventory-alerts"
                      checked={inventoryAlerts}
                      onCheckedChange={setInventoryAlerts}
                    />
                  </div>
                )}
              </div>

              {user?.role === "company_admin" && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-900">
                    {t("settings.reportSchedule")}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-frequency">
                        {t("settings.reportFrequency")}
                      </Label>
                      <Select defaultValue="weekly">
                        <SelectTrigger id="report-frequency">
                          <SelectValue
                            placeholder={t("settings.selectFrequency")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">
                            {t("settings.daily")}
                          </SelectItem>
                          <SelectItem value="weekly">
                            {t("settings.weekly")}
                          </SelectItem>
                          <SelectItem value="monthly">
                            {t("settings.monthly")}
                          </SelectItem>
                          <SelectItem value="never">
                            {t("settings.never")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="report-type">
                        {t("settings.reportTypes")}
                      </Label>
                      <Select defaultValue="all">
                        <SelectTrigger id="report-type">
                          <SelectValue
                            placeholder={t("settings.selectReportTypes")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("settings.allReports")}
                          </SelectItem>
                          <SelectItem value="inventory">
                            {t("settings.inventoryOnly")}
                          </SelectItem>
                          <SelectItem value="maintenance">
                            {t("settings.maintenanceOnly")}
                          </SelectItem>
                          <SelectItem value="vehicles">
                            {t("settings.vehiclesOnly")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveNotifications}>
                {t("settings.savePreferences")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.changePassword")}</CardTitle>
              <CardDescription>
                {t("settings.changePasswordDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">
                  {t("settings.currentPassword")}
                </Label>
                <Input id="current-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">
                  {t("settings.newPassword")}
                </Label>
                <Input id="new-password" type="password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  {t("settings.confirmNewPassword")}
                </Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSavePassword}>
                {t("settings.updatePassword")}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.twoFactorAuth")}</CardTitle>
              <CardDescription>
                {t("settings.twoFactorAuthDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {t("settings.twoFactorAuth")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("settings.twoFactorAuthDesc")}
                  </p>
                </div>
                <Button variant="outline">{t("settings.setup2FA")}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.loginSessions")}</CardTitle>
              <CardDescription>
                {t("settings.loginSessionsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <span className="material-icons text-gray-500 mr-3">
                      computer
                    </span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {t("settings.currentSession")}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {t("settings.currentSessionDesc")}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-500 bg-opacity-10 text-green-500 px-2 py-1 rounded-full">
                    {t("settings.active")}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
              >
                <span className="material-icons text-sm mr-1">logout</span>
                {t("settings.signOutAll")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.preferences")}</CardTitle>
              <CardDescription>
                {t("settings.languageDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language-select">
                  {t("settings.language")}
                </Label>
                <Select
                  value={selectedLanguage}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger id="language-select" className="w-[180px]">
                    <SelectValue placeholder={t("settings.language")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("settings.english")}</SelectItem>
                    <SelectItem value="vi">
                      {t("settings.vietnamese")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            {/* No save button needed as language changes immediately */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
