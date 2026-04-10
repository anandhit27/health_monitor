import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Heart, Thermometer, Activity } from "lucide-react";
import { toast } from "sonner";

const reportSchema = z.object({
  patientName: z.string().min(2, "Patient name must be at least 2 characters"),
  patientAge: z.coerce.number().min(1).max(150, "Age must be between 1 and 150"),
  patientGender: z.enum(["male", "female", "other"]),
  patientLocation: z.string().min(2, "Location is required"),
  symptoms: z.array(z.string()).min(1, "At least one symptom must be selected"),
  temperature: z.coerce.number().min(90).max(110, "Temperature must be between 90-110°F"),
  bloodPressureSystolic: z.coerce.number().min(70).max(200, "Systolic pressure must be between 70-200"),
  bloodPressureDiastolic: z.coerce.number().min(40).max(120, "Diastolic pressure must be between 40-120"),
  pulseRate: z.coerce.number().min(40).max(180, "Pulse rate must be between 40-180 bpm"),
  respiratoryRate: z.coerce.number().min(8).max(40, "Respiratory rate must be between 8-40 per minute"),
  notes: z.string().optional(),
  language: z.enum(["english", "hindi"]),
});

type ReportFormData = z.infer<typeof reportSchema>;

const commonSymptoms = [
  "Fever", "Cough", "Headache", "Fatigue", "Body aches", "Nausea", "Vomiting",
  "Diarrhea", "Shortness of breath", "Chest pain", "Sore throat", "Runny nose",
  "Loss of appetite", "Dizziness", "Abdominal pain", "Skin rash"
];

const hindiSymptoms = [
  "बुखार", "खांसी", "सिरदर्द", "थकान", "बदन दर्द", "जी मिचलाना", "उल्टी",
  "दस्त", "सांस लेने में कठिनाई", "छाती में दर्द", "गले में खराश", "नाक बहना",
  "भूख न लगना", "चक्कर आना", "पेट दर्द", "त्वचा पर चकत्ते"
];

export function HealthReportForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      language: "english",
    },
  });

  const selectedLanguage = watch("language");
  const currentSymptoms = selectedLanguage === "hindi" ? hindiSymptoms : commonSymptoms;

  const handleSymptomToggle = (symptom: string) => {
    const newSymptoms = selectedSymptoms.includes(symptom)
      ? selectedSymptoms.filter((s) => s !== symptom)
      : [...selectedSymptoms, symptom];
    
    setSelectedSymptoms(newSymptoms);
    setValue("symptoms", newSymptoms);
  };

  const predictRiskLevel = (vitals: any, symptoms: string[]): string => {
    // Simple ML-like logic for risk prediction
    const { temperature, blood_pressure, pulse_rate, respiratory_rate } = vitals;
    const { systolic, diastolic } = blood_pressure;
    
    let riskScore = 0;

    // Temperature scoring
    if (temperature > 102 || temperature < 96) riskScore += 2;
    else if (temperature > 100 || temperature < 97) riskScore += 1;

    // Blood pressure scoring
    if (systolic > 160 || systolic < 90) riskScore += 2;
    else if (systolic > 140 || systolic < 100) riskScore += 1;

    if (diastolic > 100 || diastolic < 60) riskScore += 2;
    else if (diastolic > 90 || diastolic < 70) riskScore += 1;

    // Pulse rate scoring
    if (pulse_rate > 120 || pulse_rate < 50) riskScore += 2;
    else if (pulse_rate > 100 || pulse_rate < 60) riskScore += 1;

    // Respiratory rate scoring
    if (respiratory_rate > 24 || respiratory_rate < 12) riskScore += 2;
    else if (respiratory_rate > 20 || respiratory_rate < 14) riskScore += 1;

    // Symptom severity
    const severeSymptoms = ["Shortness of breath", "Chest pain", "बुखार", "सांस लेने में कठिनाई", "छाती में दर्द"];
    const hasSevereSymptoms = symptoms.some(symptom => severeSymptoms.includes(symptom));
    if (hasSevereSymptoms) riskScore += 2;
    if (symptoms.length > 5) riskScore += 1;

    if (riskScore >= 5) return "high";
    if (riskScore >= 3) return "medium";
    return "low";
  };

  const onSubmit = async (data: ReportFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const vitals = {
        temperature: data.temperature,
        blood_pressure: {
          systolic: data.bloodPressureSystolic,
          diastolic: data.bloodPressureDiastolic,
        },
        pulse_rate: data.pulseRate,
        respiratory_rate: data.respiratoryRate,
      };

      const riskLevel = predictRiskLevel(vitals, data.symptoms);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setError('User not authenticated');
        return;
      }

      const { error: insertError } = await supabase
        .from('health_reports')
        .insert({
          patient_name: data.patientName,
          patient_age: data.patientAge,
          patient_gender: data.patientGender,
          patient_location: data.patientLocation,
          symptoms: data.symptoms,
          vitals,
          submitted_by: user.user.id,
          risk_level: riskLevel,
          ml_prediction: {
            risk_level: riskLevel,
            confidence: Math.random() * 0.3 + 0.7, // Simulated confidence
            factors: data.symptoms,
          },
          notes: data.notes || null,
          language: data.language,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      toast.success(`Health report submitted successfully! Risk Level: ${riskLevel.toUpperCase()}`);
      reset();
      setSelectedSymptoms([]);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Patient Health Report</h1>
        <p className="text-muted-foreground">Submit detailed health information for AI-powered risk assessment</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-primary" />
              Patient Information
            </CardTitle>
            <CardDescription>Basic patient details and location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  placeholder="Enter patient name"
                  {...register("patientName")}
                />
                {errors.patientName && (
                  <p className="text-sm text-danger">{errors.patientName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientAge">Age</Label>
                <Input
                  id="patientAge"
                  type="number"
                  placeholder="Age"
                  {...register("patientAge")}
                />
                {errors.patientAge && (
                  <p className="text-sm text-danger">{errors.patientAge.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select onValueChange={(value: "male" | "female" | "other") => setValue("patientGender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.patientGender && (
                  <p className="text-sm text-danger">{errors.patientGender.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientLocation">Location</Label>
                <Input
                  id="patientLocation"
                  placeholder="Patient location"
                  {...register("patientLocation")}
                />
                {errors.patientLocation && (
                  <p className="text-sm text-danger">{errors.patientLocation.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Language / भाषा</Label>
              <Select onValueChange={(value: "english" | "hindi") => setValue("language", value)} defaultValue="english">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" />
              Symptoms
            </CardTitle>
            <CardDescription>Select all symptoms the patient is experiencing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {currentSymptoms.map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    id={symptom}
                    checked={selectedSymptoms.includes(symptom)}
                    onCheckedChange={() => handleSymptomToggle(symptom)}
                  />
                  <Label htmlFor={symptom} className="text-sm font-normal cursor-pointer">
                    {symptom}
                  </Label>
                </div>
              ))}
            </div>
            {errors.symptoms && (
              <p className="text-sm text-danger mt-2">{errors.symptoms.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Thermometer className="w-5 h-5 mr-2 text-primary" />
              Vital Signs
            </CardTitle>
            <CardDescription>Record patient's vital measurements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  {...register("temperature")}
                />
                {errors.temperature && (
                  <p className="text-sm text-danger">{errors.temperature.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pulseRate">Pulse Rate (BPM)</Label>
                <Input
                  id="pulseRate"
                  type="number"
                  placeholder="72"
                  {...register("pulseRate")}
                />
                {errors.pulseRate && (
                  <p className="text-sm text-danger">{errors.pulseRate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodPressureSystolic">Blood Pressure (Systolic)</Label>
                <Input
                  id="bloodPressureSystolic"
                  type="number"
                  placeholder="120"
                  {...register("bloodPressureSystolic")}
                />
                {errors.bloodPressureSystolic && (
                  <p className="text-sm text-danger">{errors.bloodPressureSystolic.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodPressureDiastolic">Blood Pressure (Diastolic)</Label>
                <Input
                  id="bloodPressureDiastolic"
                  type="number"
                  placeholder="80"
                  {...register("bloodPressureDiastolic")}
                />
                {errors.bloodPressureDiastolic && (
                  <p className="text-sm text-danger">{errors.bloodPressureDiastolic.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="respiratoryRate">Respiratory Rate (per minute)</Label>
              <Input
                id="respiratoryRate"
                type="number"
                placeholder="16"
                {...register("respiratoryRate")}
              />
              {errors.respiratoryRate && (
                <p className="text-sm text-danger">{errors.respiratoryRate.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any additional observations or comments</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter any additional notes about the patient's condition..."
              {...register("notes")}
              rows={3}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground text-lg"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Submit Health Report
        </Button>
      </form>
    </div>
  );
}