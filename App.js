import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const today=()=>new Date().toISOString().slice(0,10);
const uid=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const toNum=v=>Number(String(v??'').replace(',','.'))||0;
const round1=v=>Math.round((Number(v)||0)*10)/10;

const goals=[
 {key:'Build Muscle',emoji:'💪',rest:90,sets:1,style:'More volume and isolation.'},
 {key:'Strength',emoji:'🏋️',rest:150,sets:0,style:'Heavier compounds and longer rests.'},
 {key:'Fat Loss',emoji:'🔥',rest:60,sets:0,style:'Higher density and conditioning.'},
 {key:'Recomp',emoji:'⚖️',rest:90,sets:0,style:'Balanced muscle and strength.'},
 {key:'Athletic Performance',emoji:'⚡',rest:90,sets:0,style:'Power, carries and conditioning.'},
 {key:'General Fitness',emoji:'❤️',rest:75,sets:0,style:'Balanced and beginner friendly.'},
 {key:'Endurance',emoji:'🏃',rest:45,sets:0,style:'Higher reps and shorter rests.'},
 {key:'Custom',emoji:'🎯',rest:90,sets:0,style:'Your own setup.'},
];

const equipment=[
 {id:'body',name:'Bodyweight',enabled:true},{id:'db',name:'Dumbbells',enabled:true},
 {id:'bb',name:'Barbell',enabled:true},{id:'std',name:'5ft Standard Barbell',enabled:true},
 {id:'tri',name:'Tricep Bar',enabled:true},{id:'kb',name:'Kettlebells',enabled:true},
 {id:'york',name:'York Multi Gym',enabled:true},{id:'tm',name:'Treadmill',enabled:true},
 {id:'bench',name:'Bench',enabled:true}
];

const E=(name,day,muscle,group,equipment,sets=3,reps='8-12',targetReps=10,load='Moderate',rest=90,defaultKg=10,alt='')=>({name,day,muscle,group,equipment,sets,reps,targetReps,load,rest,defaultKg,alt});

const baseExercises=[
 E('Barbell Bench Press','Push','chest','chestPress',['Barbell','Bench'],4,'5-8',6,'Heavy',150,60,'Dumbbell Bench Press'),
 E('Dumbbell Bench Press','Push','chest','chestPress',['Dumbbells','Bench'],4,'8-12',10,'Moderate',120,17.5,'Barbell Bench Press'),
 E('Incline Dumbbell Press','Push','chest','chestPress',['Dumbbells','Bench'],3,'8-12',10,'Moderate',120,15,'Dumbbell Bench Press'),
 E('Barbell Floor Press','Push','chest','chestPress',['Barbell'],4,'6-10',8,'Heavy',150,50,'Dumbbell Floor Press'),
 E('5ft Barbell Floor Press','Push','chest','chestPress',['5ft Standard Barbell'],4,'8-12',10,'Moderate',120,35,'Dumbbell Floor Press'),
 E('Dumbbell Floor Press','Push','chest','chestPress',['Dumbbells'],4,'8-12',10,'Moderate',120,17.5,'Push Ups'),
 E('Single-Arm DB Floor Press','Push','chest','chestPress',['Dumbbells'],3,'8-12 each',10,'Moderate',120,15,'Dumbbell Floor Press'),
 E('York Multi Gym Chest Press','Push','chest','chestPress',['York Multi Gym'],4,'8-12',10,'Moderate',120,35,'Dumbbell Bench Press'),
 E('Kettlebell Floor Press','Push','chest','chestPress',['Kettlebells'],3,'8-12',10,'Moderate',120,16,'Dumbbell Floor Press'),
 E('Dumbbell Fly','Push','chest','chestAccessory',['Dumbbells','Bench'],3,'10-15',12,'Light',90,8,'Dumbbell Squeeze Press'),
 E('Dumbbell Squeeze Press','Push','chest','chestAccessory',['Dumbbells'],3,'10-15',12,'Light',90,10,'Push Ups'),
 E('York Multi Gym Pec Deck Fly','Push','chest','chestAccessory',['York Multi Gym'],3,'10-15',12,'Light',90,25,'Dumbbell Fly'),
 E('Push Ups','Push','chest','chestAccessory',['Bodyweight'],3,'AMRAP',12,'Light',90,0,'Dumbbell Floor Press'),
 E('Decline Push Ups','Push','chest','chestAccessory',['Bodyweight','Bench'],3,'AMRAP',10,'Moderate',90,0,'Push Ups'),
 E('Barbell Overhead Press','Push','shoulders','shoulderPress',['Barbell'],4,'5-8',6,'Heavy',150,35,'Dumbbell Shoulder Press'),
 E('5ft Barbell Overhead Press','Push','shoulders','shoulderPress',['5ft Standard Barbell'],3,'6-10',8,'Moderate',120,30,'Dumbbell Shoulder Press'),
 E('Dumbbell Shoulder Press','Push','shoulders','shoulderPress',['Dumbbells'],4,'8-12',10,'Moderate',120,12.5,'Single-Arm DB Shoulder Press'),
 E('Single-Arm DB Shoulder Press','Push','shoulders','shoulderPress',['Dumbbells'],3,'8-12 each',10,'Moderate',120,10,'Dumbbell Shoulder Press'),
 E('Arnold Press','Push','shoulders','shoulderPress',['Dumbbells'],3,'8-12',10,'Moderate',120,10,'Dumbbell Shoulder Press'),
 E('Kettlebell Strict Press','Push','shoulders','shoulderPress',['Kettlebells'],3,'6-10 each',8,'Moderate',120,12,'Dumbbell Shoulder Press'),
 E('DB Lateral Raise','Push','shoulders','lateralRaise',['Dumbbells'],4,'12-20',15,'Light',75,6,'Lean-Away Lateral Raise'),
 E('Lean-Away Lateral Raise','Push','shoulders','lateralRaise',['Dumbbells'],3,'12-20 each',15,'Light',75,5,'DB Lateral Raise'),
 E('York Multi Gym Cable Lateral Raise','Push','shoulders','lateralRaise',['York Multi Gym'],3,'12-20 each',15,'Light',60,7.5,'DB Lateral Raise'),
 E('Front Raise','Push','shoulders','lateralRaise',['Dumbbells'],3,'10-15',12,'Light',75,6,'DB Lateral Raise'),
 E('Lying Tricep Bar Extension','Push','triceps','triceps',['Tricep Bar'],3,'10-12',11,'Light',90,15,'Close-Grip Push Ups'),
 E('Tricep Bar Close-Grip Press','Push','triceps','triceps',['Tricep Bar'],3,'8-12',10,'Moderate',90,20,'Close-Grip Bench Press'),
 E('Dumbbell Skull Crusher','Push','triceps','triceps',['Dumbbells'],3,'10-15',12,'Light',90,8,'Tricep Bar Extension'),
 E('York Multi Gym Cable Pressdown','Push','triceps','triceps',['York Multi Gym'],3,'10-15',12,'Light',75,20,'Tricep Bar Extension'),
 E('Diamond Push Ups','Push','triceps','triceps',['Bodyweight'],3,'AMRAP',10,'Moderate',90,0,'Close-Grip Push Ups'),
 E('DB Press-Out Burnout','Push','chest','finisher',['Dumbbells'],2,'20-30',25,'Light',60,5,'Push Ups'),
 E('Shadow Boxing','Push','conditioning','finisher',['Bodyweight'],3,'60 sec',60,'Light',60,0,'Push Ups'),

 E('Barbell Bent-Over Row','Pull','back','row',['Barbell'],4,'6-10',8,'Heavy',150,50,'One-Arm Dumbbell Row'),
 E('5ft Barbell Bent-Over Row','Pull','back','row',['5ft Standard Barbell'],4,'8-12',10,'Moderate',120,35,'One-Arm Dumbbell Row'),
 E('Pendlay Row','Pull','back','row',['Barbell'],4,'5-8',6,'Heavy',150,45,'Barbell Row'),
 E('Chest-Supported Dumbbell Row','Pull','back','row',['Dumbbells','Bench'],4,'8-12',10,'Moderate',120,17.5,'One-Arm Dumbbell Row'),
 E('One-Arm Dumbbell Row','Pull','back','row',['Dumbbells'],4,'10-12 each',11,'Moderate',120,20,'Cable Row'),
 E('Kettlebell Row','Pull','back','row',['Kettlebells'],4,'8-12 each',10,'Moderate',120,16,'One-Arm Dumbbell Row'),
 E('York Multi Gym Seated Cable Row','Pull','back','row',['York Multi Gym'],4,'8-12',10,'Moderate',120,40,'Barbell Row'),
 E('York Multi Gym Lat Pulldown','Pull','back','verticalPull',['York Multi Gym'],4,'8-12',10,'Moderate',120,40,'Dumbbell Pullover'),
 E('Dumbbell Pullover','Pull','back','verticalPull',['Dumbbells','Bench'],3,'10-15',12,'Light',90,12.5,'Lat Pulldown'),
 E('Barbell Romanian Deadlift','Pull','back','hinge',['Barbell'],3,'6-10',8,'Heavy',150,60,'DB Romanian Deadlift'),
 E('Rear Delt Dumbbell Fly','Pull','shoulders','rearDelt',['Dumbbells'],4,'12-20',15,'Light',75,5,'Face Pull'),
 E('Prone Y Raise','Pull','shoulders','rearDelt',['Dumbbells','Bench'],3,'12-15',12,'Light',75,3,'Rear Delt Fly'),
 E('York Multi Gym Face Pull','Pull','shoulders','rearDelt',['York Multi Gym'],3,'12-20',15,'Light',75,15,'Rear Delt Fly'),
 E('DB Shrugs','Pull','back','traps',['Dumbbells'],4,'10-15',12,'Moderate',90,22.5,'Barbell Shrugs'),
 E('Barbell Shrugs','Pull','back','traps',['Barbell'],4,'8-12',10,'Heavy',120,70,'DB Shrugs'),
 E('Dumbbell Curl','Pull','biceps','biceps',['Dumbbells'],3,'10-12',11,'Light',90,10,'Hammer Curl'),
 E('Hammer Curl','Pull','biceps','biceps',['Dumbbells'],3,'8-12',10,'Moderate',90,12.5,'Dumbbell Curl'),
 E('Concentration Curl','Pull','biceps','biceps',['Dumbbells'],3,'10-15 each',12,'Light',75,8,'Dumbbell Curl'),
 E('Zottman Curl','Pull','biceps','biceps',['Dumbbells'],3,'10-12',11,'Light',90,8,'Hammer Curl'),
 E('Barbell Curl','Pull','biceps','biceps',['Barbell'],3,'8-12',10,'Moderate',90,25,'Dumbbell Curl'),
 E('5ft Barbell Curl','Pull','biceps','biceps',['5ft Standard Barbell'],3,'8-12',10,'Moderate',90,25,'Dumbbell Curl'),
 E('Tricep Bar Curl','Pull','biceps','biceps',['Tricep Bar'],3,'10-12',11,'Light',90,15,'Hammer Curl'),
 E('York Multi Gym Cable Curl','Pull','biceps','biceps',['York Multi Gym'],3,'10-15',12,'Light',75,20,'Dumbbell Curl'),

 E('Barbell Back Squat','Legs','quads','squat',['Barbell'],4,'5-8',6,'Heavy',150,60,'Goblet Squat'),
 E('Barbell Front Squat','Legs','quads','squat',['Barbell'],3,'5-8',6,'Heavy',150,45,'Goblet Squat'),
 E('5ft Barbell Front Squat','Legs','quads','squat',['5ft Standard Barbell'],3,'8-12',10,'Moderate',120,35,'Goblet Squat'),
 E('Goblet Squat','Legs','quads','squat',['Dumbbells'],4,'10-15',12,'Moderate',120,22.5,'Bodyweight Squat'),
 E('Kettlebell Goblet Squat','Legs','quads','squat',['Kettlebells'],4,'10-15',12,'Moderate',120,20,'Goblet Squat'),
 E('Bodyweight Squat','Legs','quads','squat',['Bodyweight'],3,'15-25',20,'Light',75,0,'Wall Sit'),
 E('Barbell Romanian Deadlift','Legs','hamstrings','hinge',['Barbell'],4,'6-10',8,'Heavy',150,60,'DB Romanian Deadlift'),
 E('5ft Barbell Romanian Deadlift','Legs','hamstrings','hinge',['5ft Standard Barbell'],4,'8-12',10,'Moderate',120,40,'DB Romanian Deadlift'),
 E('DB Romanian Deadlift','Legs','hamstrings','hinge',['Dumbbells'],4,'8-12',10,'Moderate',120,20,'Hip Hinge'),
 E('Kettlebell Romanian Deadlift','Legs','hamstrings','hinge',['Kettlebells'],4,'8-12',10,'Moderate',120,20,'DB Romanian Deadlift'),
 E('Dumbbell Split Squat','Legs','quads','singleLeg',['Dumbbells'],3,'8-10 each',9,'Moderate',120,12.5,'Reverse Lunge'),
 E('Bulgarian Split Squat','Legs','quads','singleLeg',['Dumbbells','Bench'],3,'8-10 each',9,'Moderate',120,10,'Split Squat'),
 E('Reverse Lunge','Legs','quads','singleLeg',['Dumbbells'],3,'8-12 each',10,'Moderate',120,10,'Split Squat'),
 E('Step Up','Legs','quads','singleLeg',['Dumbbells','Bench'],3,'8-12 each',10,'Moderate',120,10,'Reverse Lunge'),
 E('York Multi Gym Leg Extension','Legs','quads','hamGlute',['York Multi Gym'],3,'10-15',12,'Moderate',90,35,'Goblet Squat'),
 E('York Multi Gym Hamstring Curl','Legs','hamstrings','hamGlute',['York Multi Gym'],3,'10-15',12,'Moderate',90,25,'DB Romanian Deadlift'),
 E('Glute Bridge','Legs','glutes','hamGlute',['Bodyweight'],3,'12-20',15,'Light',75,0,'Hip Thrust'),
 E('Hip Thrust','Legs','glutes','hamGlute',['Dumbbells','Bench'],3,'10-15',12,'Moderate',90,20,'Glute Bridge'),
 E('Calf Raise','Legs','calves','calves',['Dumbbells'],4,'12-20',15,'Light',75,15,'Bodyweight Calf Raise'),
 E('Single-Leg Calf Raise','Legs','calves','calves',['Bodyweight'],4,'12-20 each',15,'Light',75,0,'Calf Raise'),
 E('Sit Ups','Legs','core','core',['Bodyweight'],3,'12-20',15,'Light',75,0,'Crunches'),
 E('Crunches','Legs','core','core',['Bodyweight'],3,'15-25',20,'Light',60,0,'Sit Ups'),
 E('Plank','Legs','core','core',['Bodyweight'],3,'30-60 sec',45,'Light',75,0,'Dead Bug'),
 E('Side Plank','Legs','core','core',['Bodyweight'],3,'20-45 sec each',30,'Light',60,0,'Plank'),
 E('Russian Twist','Legs','core','core',['Bodyweight'],3,'16-30',20,'Light',60,0,'Sit Ups'),
 E('York Multi Gym Cable Crunch','Legs','core','core',['York Multi Gym'],3,'12-20',15,'Light',75,20,'Sit Ups'),
 E('Kettlebell Swing','Legs','conditioning','conditioning',['Kettlebells'],5,'15-20',15,'Moderate',75,16,'Treadmill Walk'),
 E('Treadmill Walk','Legs','conditioning','conditioning',['Treadmill'],1,'20 min',20,'Light',0,0,'Incline Treadmill Walk'),
 E('Incline Treadmill Walk','Legs','conditioning','conditioning',['Treadmill'],1,'20 min',20,'Moderate',0,0,'Treadmill Walk'),
 E('Treadmill Jog','Legs','conditioning','conditioning',['Treadmill'],1,'15 min',15,'Moderate',0,0,'Incline Treadmill Walk'),
 E('HIIT Treadmill Sprints','Legs','conditioning','conditioning',['Treadmill'],10,'30 sec',10,'Heavy',60,0,'Treadmill Jog'),

 // Extra Push - chest, shoulders, triceps
 E('Flat Dumbbell Press Neutral Grip','Push','chest','chestPress',['Dumbbells','Bench'],3,'8-12',10,'Moderate',120,15,'Dumbbell Bench Press'),
 E('Alternating Dumbbell Bench Press','Push','chest','chestPress',['Dumbbells','Bench'],3,'8-12 each',10,'Moderate',120,12.5,'Single-Arm DB Bench Press'),
 E('Paused Dumbbell Bench Press','Push','chest','chestPress',['Dumbbells','Bench'],3,'6-10',8,'Moderate',120,15,'Dumbbell Bench Press'),
 E('Tempo Dumbbell Floor Press','Push','chest','chestPress',['Dumbbells'],3,'8-12',10,'Moderate',120,15,'Dumbbell Floor Press'),
 E('Close-Grip Dumbbell Floor Press','Push','triceps','triceps',['Dumbbells'],3,'8-12',10,'Moderate',90,12.5,'Tricep Bar Close-Grip Press'),
 E('Single-Arm Kettlebell Bench Press','Push','chest','chestPress',['Kettlebells','Bench'],3,'8-12 each',10,'Moderate',120,14,'Single-Arm DB Bench Press'),
 E('Kettlebell Crush Press','Push','chest','chestAccessory',['Kettlebells'],3,'10-15',12,'Light',90,12,'Dumbbell Squeeze Press'),
 E('Single-Arm Kettlebell Floor Fly Press','Push','chest','chestAccessory',['Kettlebells'],3,'10-12 each',11,'Light',90,8,'Dumbbell Fly Press Hybrid'),
 E('Wide Push Ups','Push','chest','chestAccessory',['Bodyweight'],3,'AMRAP',12,'Light',75,0,'Push Ups'),
 E('Paused Push Ups','Push','chest','chestAccessory',['Bodyweight'],3,'AMRAP',10,'Moderate',90,0,'Push Ups'),
 E('Slow Eccentric Push Ups','Push','chest','chestAccessory',['Bodyweight'],3,'AMRAP',8,'Moderate',90,0,'Push Ups'),
 E('Push Up Shoulder Tap','Push','shoulders','finisher',['Bodyweight'],3,'20 taps',20,'Light',60,0,'Push Ups'),
 E('Pike Push Ups','Push','shoulders','shoulderPress',['Bodyweight'],3,'8-15',10,'Moderate',90,0,'Dumbbell Shoulder Press'),
 E('Half-Kneeling Single-Arm DB Press','Push','shoulders','shoulderPress',['Dumbbells'],3,'8-12 each',10,'Moderate',90,10,'Single-Arm DB Shoulder Press'),
 E('Z Press Dumbbell','Push','shoulders','shoulderPress',['Dumbbells'],3,'8-12',10,'Moderate',90,10,'Seated DB Shoulder Press'),
 E('Seated Arnold Press','Push','shoulders','shoulderPress',['Dumbbells','Bench'],3,'8-12',10,'Moderate',120,10,'Arnold Press'),
 E('Kettlebell Bottoms-Up Press','Push','shoulders','shoulderPress',['Kettlebells'],3,'6-10 each',8,'Light',90,8,'Kettlebell Strict Press'),
 E('Kettlebell Seesaw Press','Push','shoulders','shoulderPress',['Kettlebells'],3,'8-12 each',10,'Moderate',120,12,'Kettlebell Strict Press'),
 E('Dumbbell Cuban Press','Push','shoulders','lateralRaise',['Dumbbells'],3,'10-15',12,'Light',75,4,'DB Lateral Raise'),
 E('Dumbbell Scaption Raise','Push','shoulders','lateralRaise',['Dumbbells'],3,'12-20',15,'Light',60,5,'DB Lateral Raise'),
 E('Bent-Arm Lateral Raise','Push','shoulders','lateralRaise',['Dumbbells'],3,'12-20',15,'Light',60,7.5,'DB Lateral Raise'),
 E('Lateral Raise Mechanical Drop Set','Push','shoulders','lateralRaise',['Dumbbells'],2,'12-20',15,'Light',75,5,'DB Lateral Raise'),
 E('Tricep Bar Overhead Extension','Push','triceps','triceps',['Tricep Bar'],3,'10-15',12,'Light',90,15,'Lying Tricep Bar Extension'),
 E('Dumbbell Tate Press','Push','triceps','triceps',['Dumbbells','Bench'],3,'10-15',12,'Light',90,8,'Dumbbell Skull Crusher'),
 E('Dumbbell Kickback','Push','triceps','triceps',['Dumbbells'],3,'12-20 each',15,'Light',60,5,'Cable Pressdown'),
 E('Single-Arm Tricep Kickback','Push','triceps','triceps',['Dumbbells'],3,'12-20 each',15,'Light',60,5,'Dumbbell Kickback'),
 E('York Multi Gym Overhead Cable Extension','Push','triceps','triceps',['York Multi Gym'],3,'10-15',12,'Light',75,20,'Cable Pressdown'),
 E('York Multi Gym Single-Arm Pressdown','Push','triceps','triceps',['York Multi Gym'],3,'10-15 each',12,'Light',60,10,'Cable Pressdown'),
 E('Bench Dips','Push','triceps','triceps',['Bodyweight','Bench'],3,'8-15',10,'Moderate',90,0,'Close-Grip Push Ups'),

 // Extra Pull - back, rear delts, biceps
 E('Single-Arm Chest-Supported Row','Pull','back','row',['Dumbbells','Bench'],3,'8-12 each',10,'Moderate',120,15,'One-Arm Dumbbell Row'),
 E('Incline Dumbbell Row','Pull','back','row',['Dumbbells','Bench'],4,'8-12',10,'Moderate',120,17.5,'Chest-Supported Row'),
 E('Dumbbell Seal Row','Pull','back','row',['Dumbbells','Bench'],3,'8-12',10,'Moderate',120,15,'Chest-Supported Row'),
 E('Meadows Row','Pull','back','row',['Barbell'],3,'8-12 each',10,'Moderate',120,35,'One-Arm Dumbbell Row'),
 E('5ft Barbell Meadows Row','Pull','back','row',['5ft Standard Barbell'],3,'8-12 each',10,'Moderate',120,30,'One-Arm Dumbbell Row'),
 E('Underhand Barbell Row','Pull','back','row',['Barbell'],4,'6-10',8,'Heavy',150,45,'Barbell Bent-Over Row'),
 E('Wide-Grip Barbell Row','Pull','back','row',['Barbell'],4,'8-12',10,'Moderate',120,40,'Barbell Bent-Over Row'),
 E('Dumbbell Gorilla Row','Pull','back','row',['Dumbbells'],3,'8-12 each',10,'Moderate',120,17.5,'One-Arm Dumbbell Row'),
 E('Kettlebell Gorilla Row','Pull','back','row',['Kettlebells'],3,'8-12 each',10,'Moderate',120,16,'Kettlebell Row'),
 E('Kettlebell Dead Row','Pull','back','row',['Kettlebells'],3,'8-12 each',10,'Moderate',120,16,'Kettlebell Row'),
 E('York Multi Gym Close-Grip Pulldown','Pull','back','verticalPull',['York Multi Gym'],4,'8-12',10,'Moderate',120,40,'Lat Pulldown'),
 E('York Multi Gym Wide-Grip Pulldown','Pull','back','verticalPull',['York Multi Gym'],4,'8-12',10,'Moderate',120,40,'Lat Pulldown'),
 E('York Multi Gym Straight-Arm Pulldown','Pull','back','verticalPull',['York Multi Gym'],3,'10-15',12,'Light',75,20,'Dumbbell Pullover'),
 E('Dumbbell Lat Prayer Pullover','Pull','back','verticalPull',['Dumbbells'],3,'12-15',12,'Light',75,10,'Dumbbell Pullover'),
 E('Barbell Good Morning','Pull','back','hinge',['Barbell'],3,'8-12',10,'Moderate',120,35,'Romanian Deadlift'),
 E('5ft Barbell Good Morning','Pull','back','hinge',['5ft Standard Barbell'],3,'8-12',10,'Moderate',120,30,'Romanian Deadlift'),
 E('Dumbbell Good Morning','Pull','back','hinge',['Dumbbells'],3,'10-15',12,'Light',90,15,'Romanian Deadlift'),
 E('Dumbbell Rear Delt Row','Pull','shoulders','rearDelt',['Dumbbells'],3,'10-15',12,'Light',75,8,'Rear Delt Fly'),
 E('Chest-Supported Rear Delt Row','Pull','shoulders','rearDelt',['Dumbbells','Bench'],3,'10-15',12,'Light',75,8,'Rear Delt Fly'),
 E('Reverse Snow Angels','Pull','shoulders','rearDelt',['Bodyweight'],3,'12-20',15,'Light',60,0,'Rear Delt Fly'),
 E('York Multi Gym Rear Delt Cable Fly','Pull','shoulders','rearDelt',['York Multi Gym'],3,'12-20',15,'Light',60,10,'Rear Delt Fly'),
 E('Dumbbell Incline Shrug','Pull','back','traps',['Dumbbells','Bench'],3,'10-15',12,'Moderate',90,20,'DB Shrugs'),
 E('Kettlebell Suitcase Shrug','Pull','back','traps',['Kettlebells'],3,'10-15 each',12,'Moderate',90,20,'DB Shrugs'),
 E('Barbell Behind-Back Shrug','Pull','back','traps',['Barbell'],3,'8-12',10,'Moderate',120,50,'Barbell Shrugs'),
 E('Incline Dumbbell Curl','Pull','biceps','biceps',['Dumbbells','Bench'],3,'8-12',10,'Light',90,8,'Dumbbell Curl'),
 E('Spider Curl','Pull','biceps','biceps',['Dumbbells','Bench'],3,'10-15',12,'Light',75,8,'Concentration Curl'),
 E('Seated Dumbbell Curl','Pull','biceps','biceps',['Dumbbells','Bench'],3,'10-12',11,'Light',75,10,'Dumbbell Curl'),
 E('Alternating Dumbbell Curl','Pull','biceps','biceps',['Dumbbells'],3,'10-12 each',11,'Light',75,10,'Dumbbell Curl'),
 E('21s Barbell Curl','Pull','biceps','biceps',['Barbell'],2,'21 reps',21,'Light',90,20,'Barbell Curl'),
 E('21s Tricep Bar Curl','Pull','biceps','biceps',['Tricep Bar'],2,'21 reps',21,'Light',90,15,'Tricep Bar Curl'),
 E('York Multi Gym Rope Hammer Curl','Pull','biceps','biceps',['York Multi Gym'],3,'10-15',12,'Light',75,15,'Hammer Curl'),
 E('York Multi Gym Single-Arm Cable Curl','Pull','biceps','biceps',['York Multi Gym'],3,'10-15 each',12,'Light',60,10,'Dumbbell Curl'),
 E('Kettlebell Curl','Pull','biceps','biceps',['Kettlebells'],3,'8-12',10,'Light',90,8,'Dumbbell Curl'),

 // Extra Legs
 E('Dumbbell Front Squat','Legs','quads','squat',['Dumbbells'],4,'8-12',10,'Moderate',120,17.5,'Goblet Squat'),
 E('Double Dumbbell Squat','Legs','quads','squat',['Dumbbells'],4,'8-12',10,'Moderate',120,17.5,'Goblet Squat'),
 E('Pause Goblet Squat','Legs','quads','squat',['Dumbbells'],3,'8-12',10,'Moderate',120,20,'Goblet Squat'),
 E('Tempo Goblet Squat','Legs','quads','squat',['Dumbbells'],3,'10-15',12,'Moderate',120,18,'Goblet Squat'),
 E('Kettlebell Box Squat','Legs','quads','squat',['Kettlebells','Bench'],3,'8-12',10,'Moderate',120,20,'Goblet Squat'),
 E('Cyclist Goblet Squat','Legs','quads','squat',['Dumbbells'],3,'10-15',12,'Moderate',120,18,'Goblet Squat'),
 E('Barbell Box Squat','Legs','quads','squat',['Barbell','Bench'],4,'5-8',6,'Heavy',150,55,'Back Squat'),
 E('Dumbbell Sumo Squat','Legs','glutes','squat',['Dumbbells'],3,'10-15',12,'Moderate',120,22.5,'Goblet Squat'),
 E('Kettlebell Sumo Squat','Legs','glutes','squat',['Kettlebells'],3,'10-15',12,'Moderate',120,24,'Goblet Squat'),
 E('Stiff-Leg Barbell Deadlift','Legs','hamstrings','hinge',['Barbell'],4,'6-10',8,'Heavy',150,55,'Romanian Deadlift'),
 E('Stiff-Leg Dumbbell Deadlift','Legs','hamstrings','hinge',['Dumbbells'],4,'8-12',10,'Moderate',120,20,'DB Romanian Deadlift'),
 E('Single-Leg Dumbbell RDL','Legs','hamstrings','hinge',['Dumbbells'],3,'8-12 each',10,'Moderate',120,12.5,'DB Romanian Deadlift'),
 E('Single-Leg Kettlebell RDL','Legs','hamstrings','hinge',['Kettlebells'],3,'8-12 each',10,'Moderate',120,16,'Single-Leg DB RDL'),
 E('Barbell Hip Hinge','Legs','hamstrings','hinge',['Barbell'],3,'10-15',12,'Moderate',120,45,'Romanian Deadlift'),
 E('Dumbbell Walking-In-Place Lunge','Legs','quads','singleLeg',['Dumbbells'],3,'8-12 each',10,'Moderate',120,10,'Reverse Lunge'),
 E('Bodyweight Reverse Lunge','Legs','quads','singleLeg',['Bodyweight'],3,'10-15 each',12,'Light',90,0,'Reverse Lunge'),
 E('Kettlebell Split Squat','Legs','quads','singleLeg',['Kettlebells'],3,'8-12 each',10,'Moderate',120,12,'Dumbbell Split Squat'),
 E('Lateral Lunge','Legs','glutes','singleLeg',['Dumbbells'],3,'8-12 each',10,'Moderate',120,10,'Reverse Lunge'),
 E('Curtsy Lunge','Legs','glutes','singleLeg',['Dumbbells'],3,'8-12 each',10,'Light',90,8,'Reverse Lunge'),
 E('Single-Leg Box Squat','Legs','quads','singleLeg',['Bodyweight','Bench'],3,'8-12 each',10,'Light',90,0,'Split Squat'),
 E('Dumbbell Hamstring Bridge','Legs','hamstrings','hamGlute',['Dumbbells'],3,'10-15',12,'Moderate',90,20,'Glute Bridge'),
 E('Single-Leg Glute Bridge','Legs','glutes','hamGlute',['Bodyweight'],3,'10-15 each',12,'Light',75,0,'Glute Bridge'),
 E('Dumbbell Hip Thrust','Legs','glutes','hamGlute',['Dumbbells','Bench'],3,'10-15',12,'Moderate',90,22.5,'Hip Thrust'),
 E('Kettlebell Hip Thrust','Legs','glutes','hamGlute',['Kettlebells','Bench'],3,'10-15',12,'Moderate',90,20,'Hip Thrust'),
 E('York Multi Gym Single-Leg Extension','Legs','quads','hamGlute',['York Multi Gym'],3,'10-15 each',12,'Moderate',90,20,'Leg Extension'),
 E('York Multi Gym Single-Leg Hamstring Curl','Legs','hamstrings','hamGlute',['York Multi Gym'],3,'10-15 each',12,'Moderate',90,15,'Hamstring Curl'),
 E('Seated Dumbbell Calf Raise','Legs','calves','calves',['Dumbbells','Bench'],4,'12-25',15,'Light',60,20,'Calf Raise'),
 E('Standing Bodyweight Calf Raise','Legs','calves','calves',['Bodyweight'],4,'15-30',20,'Light',60,0,'Calf Raise'),
 E('Paused Calf Raise','Legs','calves','calves',['Dumbbells'],4,'12-20',15,'Light',75,15,'Calf Raise'),

 // Extra Core / Conditioning / Treadmill
 E('Dead Bug','Legs','core','core',['Bodyweight'],3,'10 each',10,'Light',60,0,'Plank'),
 E('Bird Dog','Legs','core','core',['Bodyweight'],3,'10 each',10,'Light',60,0,'Dead Bug'),
 E('Reverse Crunch','Legs','core','core',['Bodyweight'],3,'12-20',15,'Light',60,0,'Crunches'),
 E('Bicycle Crunch','Legs','core','core',['Bodyweight'],3,'20-40',30,'Light',60,0,'Russian Twist'),
 E('Hollow Hold','Legs','core','core',['Bodyweight'],3,'20-45 sec',30,'Light',60,0,'Plank'),
 E('Heel Taps','Legs','core','core',['Bodyweight'],3,'20-40',30,'Light',60,0,'Crunches'),
 E('Mountain Climbers','Legs','conditioning','conditioning',['Bodyweight'],3,'30-45 sec',35,'Light',60,0,'Plank'),
 E('Bear Crawl Hold','Legs','conditioning','conditioning',['Bodyweight'],3,'20-40 sec',30,'Light',60,0,'Plank'),
 E('Burpee','Legs','conditioning','conditioning',['Bodyweight'],3,'8-15',10,'Moderate',90,0,'Bodyweight Squat'),
 E('High Knees','Legs','conditioning','conditioning',['Bodyweight'],3,'30-45 sec',35,'Light',60,0,'Mountain Climbers'),
 E('Jumping Jacks','Legs','conditioning','conditioning',['Bodyweight'],3,'45-60 sec',45,'Light',60,0,'High Knees'),
 E('Squat Thrust','Legs','conditioning','conditioning',['Bodyweight'],3,'10-20',15,'Moderate',75,0,'Burpee'),
 E('Farmer Carry','Legs','conditioning','conditioning',['Dumbbells'],4,'30-60 sec',45,'Moderate',75,22.5,'Farmer Carry March'),
 E('Kettlebell Farmer Carry','Legs','conditioning','conditioning',['Kettlebells'],4,'30-60 sec',45,'Moderate',75,20,'Farmer Carry'),
 E('Kettlebell Clean','Pull','conditioning','conditioning',['Kettlebells'],4,'6-10 each',8,'Moderate',90,12,'Kettlebell High Pull'),
 E('Kettlebell Clean and Press','Push','conditioning','finisher',['Kettlebells'],4,'6-8 each',8,'Moderate',120,12,'DB Clean and Press'),
 E('Kettlebell Thruster','Legs','conditioning','conditioning',['Kettlebells'],4,'8-12',10,'Heavy',120,12,'Kettlebell Goblet Squat'),
 E('Treadmill Easy Walk','Legs','conditioning','conditioning',['Treadmill'],1,'10 min',10,'Light',0,0,'Treadmill Walk'),
 E('Treadmill Long Walk','Legs','conditioning','conditioning',['Treadmill'],1,'30 min',30,'Light',0,0,'Treadmill Walk'),
 E('Treadmill Hill Walk','Legs','conditioning','conditioning',['Treadmill'],1,'15 min',15,'Moderate',0,0,'Incline Treadmill Walk'),
 E('Treadmill Zone 2 Jog','Legs','conditioning','conditioning',['Treadmill'],1,'25 min',25,'Moderate',0,0,'Treadmill Jog'),
 E('Treadmill Tempo Run','Legs','conditioning','conditioning',['Treadmill'],1,'12 min',12,'Heavy',0,0,'Treadmill Run'),
 E('Treadmill Walk-Run Intervals','Legs','conditioning','conditioning',['Treadmill'],8,'1 min run / 1 min walk',8,'Moderate',60,0,'Treadmill Jog'),
 E('Treadmill Incline Intervals','Legs','conditioning','conditioning',['Treadmill'],8,'45 sec incline / 75 sec easy',8,'Heavy',75,0,'Incline Treadmill Walk'),

];


const STORAGE_KEY_V2='homefit_pro_workout_v2_session';
const defaultState={tab:'Workout',goal:'Recomp',experience:'Intermediate',duration:60,frequency:3,priorities:['shoulders','biceps','triceps'],equipment,workouts:[],customExercises:[],progress:[],backupText:'',templates:[]};
const dayGroups={Push:['chestPress','chestAccessory','shoulderPress','lateralRaise','triceps','finisher'],Pull:['row','verticalPull','rearDelt','traps','biceps','biceps'],Legs:['squat','hinge','singleLeg','hamGlute','calves','core','conditioning']};
const muscles=['chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','core','conditioning'];

export default function App(){
 const [state,setState]=useState(defaultState);
 const [workoutDraft,setWorkoutDraft]=useState([]);
 const [sessionStarted,setSessionStarted]=useState(false);
 const [showDatabase,setShowDatabase]=useState(false);
 const [swapIndex,setSwapIndex]=useState(null);
 const [insertIndex,setInsertIndex]=useState(null);
 const [exerciseQuery,setExerciseQuery]=useState('');
 const [muscleFilter,setMuscleFilter]=useState('all');
 const [selectedWorkout,setSelectedWorkout]=useState(null);
 const [selectedExercise,setSelectedExercise]=useState(null);
 const [seconds,setSeconds]=useState(0);
 const [workoutNotes,setWorkoutNotes]=useState('');
 const [progress,setProgress]=useState({weight:'',waist:'',chest:'',arms:'',thighs:''});
 const [custom,setCustom]=useState({name:'',day:'Push',muscle:'chest',group:'chestPress',equipment:'Dumbbells',sets:'3',reps:'8-12',targetReps:'10',load:'Moderate',rest:'90',defaultKg:'10'});
 const [newEq,setNewEq]=useState({name:'',maxKg:'',increment:'0.5'});
 const [backupInput,setBackupInput]=useState('');
 const timer=useRef(null);
 useEffect(()=>{AsyncStorage.getItem(STORAGE_KEY_V2).then(v=>{if(v)setState({...defaultState,...JSON.parse(v)});}).catch(()=>{});},[]);
 useEffect(()=>{AsyncStorage.setItem(STORAGE_KEY_V2,JSON.stringify(state)).catch(()=>{});},[state]);
 useEffect(()=>()=>timer.current&&clearInterval(timer.current),[]);
 const enabled=state.equipment.filter(e=>e.enabled).map(e=>e.name);
 const allExercises=[...baseExercises,...state.customExercises];
 const nextDay=['Push','Pull','Legs'][state.workouts.length%3];
 const recovery=getRecovery(state.workouts);
 const prs=useMemo(()=>getPRs(state.workouts),[state.workouts]);
 const weeklyVolume=volumeLast7(state.workouts);
 const weekStats=getWeekStats(state.workouts);
 const draftVolume=workoutVolume(workoutDraft);
 const exerciseStats=useMemo(()=>getExerciseStats(state.workouts),[state.workouts]);
 const sortedStats=Object.entries(exerciseStats).sort((a,b)=>b[1].volume-a[1].volume);
 const exerciseDatabase=allExercises.filter(e=>(muscleFilter==='all'||e.muscle===muscleFilter)).filter(e=>(e.name+' '+e.day+' '+e.muscle+' '+e.group+' '+e.equipment.join(' ')).toLowerCase().includes(exerciseQuery.toLowerCase())).slice(0,250);
 const swapPool=swapIndex!==null?smartSwapPool(workoutDraft[swapIndex],allExercises,enabled,state.workouts,state.priorities,recovery):exerciseDatabase;
 useEffect(()=>{if(!sessionStarted)setWorkoutDraft(generateWorkout({day:nextDay,allExercises,enabled,workouts:state.workouts,goal:state.goal,priorities:state.priorities,recovery}));},[nextDay,enabled.join('|'),state.goal,state.customExercises.length]);
 function patch(p){setState(s=>({...s,...p}));}
 function makeDraft(e){const kg=suggestKg(e,state.workouts),g=goals.find(x=>x.key===state.goal)||goals[3],sets=Math.max(1,e.sets+(g.sets||0)),rest=g.rest||e.rest;return{...e,sets,rest,suggestedKg:kg,done:false,notes:'',setsDone:Array.from({length:sets},()=>({kg,reps:e.targetReps,rest,done:false}))};}
 function updateExercise(i,p){setWorkoutDraft(w=>w.map((e,ei)=>ei===i?{...e,...p}:e));}
 function updateSet(i,j,k,v){setWorkoutDraft(w=>w.map((e,ei)=>ei!==i?e:{...e,setsDone:e.setsDone.map((s,si)=>si!==j?s:{...s,[k]:v})}));}
 function addSet(i){setWorkoutDraft(w=>w.map((e,ei)=>ei!==i?e:{...e,sets:e.sets+1,setsDone:[...e.setsDone,{kg:e.suggestedKg,reps:e.targetReps,rest:e.rest,done:false}]}));}
 function removeSet(i,j){setWorkoutDraft(w=>w.map((e,ei)=>ei!==i?e:{...e,sets:Math.max(1,e.sets-1),setsDone:e.setsDone.filter((_,si)=>si!==j)}));}
 function startRest(sec){if(timer.current)clearInterval(timer.current);setSeconds(sec);timer.current=setInterval(()=>setSeconds(x=>{if(x<=1){clearInterval(timer.current);timer.current=null;return 0;}return x-1;}),1000);}
 function startWorkout(){setSessionStarted(true);Alert.alert('Workout started','Log each set as you go.');}
 function addExercise(e){const item=makeDraft(e);setWorkoutDraft(w=>insertIndex===null?[...w,item]:[...w.slice(0,insertIndex+1),item,...w.slice(insertIndex+1)]);setInsertIndex(null);setShowDatabase(false);}
 function swapExercise(i,e){setWorkoutDraft(w=>w.map((old,x)=>x===i?makeDraft(e):old));setSwapIndex(null);setShowDatabase(false);setExerciseQuery('');setMuscleFilter('all');}
 function logWorkout(rating){const exercises=workoutDraft.map(e=>({...e,setsDone:e.setsDone.map(s=>({kg:toNum(s.kg),reps:toNum(s.reps),rest:toNum(s.rest)||e.rest,done:!!s.done}))}));const w={id:uid('workout'),date:today(),day:nextDay,rating,notes:workoutNotes,exercises,volume:workoutVolume(exercises)};patch({workouts:[...state.workouts,w]});setSessionStarted(false);setWorkoutNotes('');Alert.alert('Workout logged',`${nextDay} saved. Volume ${w.volume}kg.`);}
 function regenerate(){setSessionStarted(false);setWorkoutDraft(generateWorkout({day:nextDay,allExercises,enabled,workouts:state.workouts,goal:state.goal,priorities:state.priorities,recovery,randomise:true}));}
 function toggleEq(id){patch({equipment:state.equipment.map(e=>e.id===id?{...e,enabled:!e.enabled}:e)});}
 function addEquipment(){const name=newEq.name.trim();if(!name)return;patch({equipment:[...state.equipment,{id:uid('eq'),name,enabled:true,maxKg:toNum(newEq.maxKg),increment:toNum(newEq.increment)||0.5}]});setNewEq({name:'',maxKg:'',increment:'0.5'});}
 function togglePriority(m){patch({priorities:state.priorities.includes(m)?state.priorities.filter(x=>x!==m):[...state.priorities,m].slice(-3)});}
 function addProgress(){patch({progress:[...state.progress,{id:uid('prog'),date:today(),weight:toNum(progress.weight),waist:toNum(progress.waist),chest:toNum(progress.chest),arms:toNum(progress.arms),thighs:toNum(progress.thighs)}]});setProgress({weight:'',waist:'',chest:'',arms:'',thighs:''});}
 function addCustom(){if(!custom.name.trim())return;const e=E(custom.name.trim(),custom.day,custom.muscle,custom.group,custom.equipment.split(',').map(x=>x.trim()).filter(Boolean),toNum(custom.sets)||3,custom.reps,toNum(custom.targetReps)||10,custom.load,toNum(custom.rest)||90,toNum(custom.defaultKg));patch({customExercises:[e,...state.customExercises]});setCustom({...custom,name:''});}
 function saveTemplate(){const name=`${nextDay} ${state.goal} ${new Date().toLocaleDateString()}`;patch({templates:[{id:uid('tpl'),name,day:nextDay,exercises:workoutDraft.map(e=>e.name)},...state.templates].slice(0,20)});Alert.alert('Template saved',name);}
 function loadTemplate(t){const ex=t.exercises.map(n=>allExercises.find(e=>e.name===n)).filter(Boolean).map(makeDraft);if(ex.length){setWorkoutDraft(ex);setSessionStarted(false);patch({tab:'Workout'});} }
 function backup(){const b=JSON.stringify({...state,tab:'Workout'},null,2);patch({backupText:b});setBackupInput(b);}
 function restore(){try{setState({...defaultState,...JSON.parse(backupInput)});Alert.alert('Restored','Backup restored.');}catch(e){Alert.alert('Restore failed','Backup text is not valid JSON.');}}
 return <SafeAreaView style={styles.app}><StatusBar style="light"/><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}><View style={styles.header}><Text style={styles.title}>HomeFit Pro</Text><Text style={styles.subtitle}>Smart PPL home gym tracker</Text></View><ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
 {state.tab==='Workout'&&<View><Card title={`${nextDay} Day`} badge={sessionStarted?'LIVE':state.goal}><Text style={styles.hero}>{workoutDraft.length} Exercises</Text><Text style={styles.text}>Estimated {state.duration} min • Draft volume {draftVolume}kg</Text><Text style={styles.muted}>Proper workout mode: start first, log sets as you train, then complete.</Text><View style={styles.choiceRow}><Button label={sessionStarted?'Workout Running':'Start Workout'} onPress={startWorkout}/><Button secondary label="Regenerate" onPress={regenerate}/><Button secondary label="Save Template" onPress={saveTemplate}/><Button secondary label="Add Exercise" onPress={()=>{setInsertIndex(workoutDraft.length-1);setSwapIndex(null);setShowDatabase(true);}}/></View>{workoutDraft.map((e,i)=><View key={`${e.name}-${i}`} style={[styles.exercise,e.done&&styles.exerciseDone]}><View style={styles.rowBetween}><Text style={styles.exerciseName}>{i+1}. {e.name}</Text><TouchableOpacity onPress={()=>updateExercise(i,{done:!e.done})}><Text style={styles.done}>{e.done?'✓ Done':'Mark done'}</Text></TouchableOpacity></View><Text style={styles.muted}>{e.muscle} • {e.group} • {e.load} • {e.equipment.join(', ')}</Text><Text style={styles.text}>{e.setsDone.length} sets • {e.reps} • Suggested {e.suggestedKg}kg • Rest {e.rest}s</Text><View style={styles.choiceRow}><Button secondary label="Add Below" onPress={()=>{setInsertIndex(i);setSwapIndex(null);setShowDatabase(true);}}/><Button secondary label="Smart Swap" onPress={()=>{setSwapIndex(i);setInsertIndex(null);setExerciseQuery('');setMuscleFilter('all');setShowDatabase(true);}}/><Button danger label="Remove" onPress={()=>setWorkoutDraft(w=>w.filter((_,x)=>x!==i))}/></View>{e.setsDone.map((s,j)=><View key={j} style={styles.row}><TouchableOpacity onPress={()=>updateSet(i,j,'done',!s.done)}><Text style={styles.tick}>{s.done?'✓':'○'}</Text></TouchableOpacity><Text style={styles.setLabel}>Set {j+1}</Text><Input small value={String(s.kg)} onChangeText={v=>updateSet(i,j,'kg',v)} keyboardType="decimal-pad"/><Text style={styles.muted}>kg</Text><Input small value={String(s.reps)} onChangeText={v=>updateSet(i,j,'reps',v)} keyboardType="decimal-pad"/><Text style={styles.muted}>reps</Text><TouchableOpacity onPress={()=>removeSet(i,j)}><Text style={styles.remove}>×</Text></TouchableOpacity></View>)}<View style={styles.choiceRow}><Button secondary label="+ Add Set" onPress={()=>addSet(i)}/><Button secondary label={`Start ${e.rest}s rest`} onPress={()=>startRest(e.rest)}/></View><Input placeholder="Exercise notes" value={e.notes||''} onChangeText={v=>updateExercise(i,{notes:v})}/></View>)}{seconds>0&&<Text style={styles.hero}>Rest {format(seconds)}</Text>}<Input multiline placeholder="Workout notes" value={workoutNotes} onChangeText={setWorkoutNotes}/><Button label="Complete / Log Workout" onPress={()=>Alert.alert('Workout rating','How hard was it?',[{text:'Easy',onPress:()=>logWorkout('Easy')},{text:'Moderate',onPress:()=>logWorkout('Moderate')},{text:'Hard',onPress:()=>logWorkout('Hard')},{text:'Very Hard',onPress:()=>logWorkout('Very Hard')}])}/></Card><Button secondary label={showDatabase?'Hide Exercise Database':'Show Exercise Database'} onPress={()=>{setShowDatabase(!showDatabase);if(showDatabase){setSwapIndex(null);setInsertIndex(null);}}}/>{showDatabase&&<Card title={swapIndex!==null?'Smart Swap':'Exercise Database'} badge={`${(swapIndex!==null?swapPool:exerciseDatabase).length}/${allExercises.length}`}><Text style={styles.muted}>{swapIndex!==null?`Best replacements for ${workoutDraft[swapIndex]?.name}`:insertIndex!==null?'Choose exercise to add below selected exercise':'Choose exercise to add to workout'}</Text>{swapIndex===null&&<><Input placeholder="Search exercise, muscle or equipment" value={exerciseQuery} onChangeText={setExerciseQuery}/><View style={styles.choiceRow}>{['all',...muscles].map(m=><Button key={m} secondary label={m} onPress={()=>setMuscleFilter(m)}/>)}</View></>}{(swapIndex!==null?swapPool:exerciseDatabase).map(e=><View key={e.name} style={styles.food}><Text style={styles.exerciseName}>{e.name}</Text><Text style={styles.muted}>{e.day} • {e.muscle} • {e.group} • {e.load} • {e.equipment.join(', ')}{e.alt?` • Alt: ${e.alt}`:''}</Text>{swapIndex!==null?<Button secondary label="Use as Swap" onPress={()=>swapExercise(swapIndex,e)}/>:<Button secondary label={insertIndex!==null?'Add Here':'Add'} onPress={()=>addExercise(e)}/>}</View>)}</Card>}</View>}
 {state.tab==='Recovery'&&<View><Card title="Muscle Recovery" badge="auto"><Text style={styles.muted}>Recovery drops after workouts and comes back each day.</Text>{Object.entries(recovery).map(([m,v])=><View key={m} style={styles.recoveryRow}><View style={styles.rowBetween}><Text style={styles.text}>{label(m)}</Text><Text style={styles.text}>{v}%</Text></View><Bar value={v} max={100}/></View>)}</Card><Card title="Recommendations"><Text style={styles.text}>{recoveryAdvice(recovery)}</Text></Card></View>}
 {state.tab==='Targets'&&<View><Card title="Goal Selection" badge={state.goal}><View style={styles.choiceRow}>{goals.map(g=><TouchableOpacity key={g.key} style={[styles.choice,state.goal===g.key&&styles.choiceOn]} onPress={()=>patch({goal:g.key})}><Text style={styles.choiceText}>{g.emoji} {g.key}</Text><Text style={styles.muted}>{g.style}</Text></TouchableOpacity>)}</View></Card><Card title="Training Setup"><Text style={styles.text}>Experience</Text><View style={styles.choiceRow}>{['Beginner','Intermediate','Advanced'].map(x=><Button key={x} secondary={state.experience!==x} label={x} onPress={()=>patch({experience:x})}/>)}</View><Text style={styles.text}>Workout Duration</Text><View style={styles.choiceRow}>{[30,45,60,75,90].map(x=><Button key={x} secondary={state.duration!==x} label={`${x} min`} onPress={()=>patch({duration:x})}/>)}</View><Text style={styles.text}>Weekly Frequency</Text><View style={styles.choiceRow}>{[2,3,4,5,6].map(x=><Button key={x} secondary={state.frequency!==x} label={`${x}/week`} onPress={()=>patch({frequency:x})}/>)}</View></Card><Card title="Muscle Priorities" badge="choose up to 3"><View style={styles.choiceRow}>{muscles.map(m=><TouchableOpacity key={m} style={[styles.choice,state.priorities.includes(m)&&styles.choiceOn]} onPress={()=>togglePriority(m)}><Text style={styles.choiceText}>{label(m)}</Text></TouchableOpacity>)}</View></Card><Card title="Weekly Targets"><StatGrid data={[["Workouts",`${weekStats.workouts}/${state.frequency}`],["Volume",`${weekStats.volume}kg`],["Push",weekStats.push],["Pull",weekStats.pull],["Legs",weekStats.legs]]}/></Card></View>}
 {state.tab==='History'&&<View><Card title="Progress Summary"><StatGrid data={[["7-day volume",`${weeklyVolume}kg`],["Total workouts",state.workouts.length],["PRs",Object.keys(prs).length],["Streak",`${getStreak(state)} days`]]}/></Card><Card title="Exercise Stats" badge="tap one">{sortedStats.length===0?<Text style={styles.muted}>Stats appear after logging workouts.</Text>:sortedStats.slice(0,20).map(([n,s])=><TouchableOpacity key={n} style={styles.history} onPress={()=>setSelectedExercise({name:n,...s})}><Text style={styles.text}>{n}</Text><Text style={styles.muted}>{s.sessions} sessions • {s.volume}kg volume • Best {s.best.kg}kg x {s.best.reps}</Text></TouchableOpacity>)}</Card>{selectedExercise&&<Card title={selectedExercise.name} badge="stats"><StatGrid data={[["Sessions",selectedExercise.sessions],["Volume",`${selectedExercise.volume}kg`],["Best",`${selectedExercise.best.kg}kg x ${selectedExercise.best.reps}`],["Sets",selectedExercise.sets]]}/></Card>}<Card title="Workout History">{state.workouts.slice(-20).reverse().map(w=><TouchableOpacity key={w.id} style={styles.history} onPress={()=>setSelectedWorkout(w)}><Text style={styles.text}>{w.date} • {w.day} • {w.rating}</Text><Text style={styles.muted}>{w.volume}kg • {w.exercises.length} exercises{w.notes?` • ${w.notes}`:''}</Text></TouchableOpacity>)}</Card>{selectedWorkout&&<Card title={`${selectedWorkout.day} Details`} badge={selectedWorkout.date}>{selectedWorkout.exercises.map(e=><View key={e.name} style={styles.food}><Text style={styles.exerciseName}>{e.name}</Text><Text style={styles.muted}>{e.setsDone.map((s,i)=>`S${i+1}: ${s.kg}kg x ${s.reps}`).join('   ')}</Text>{e.notes?<Text style={styles.text}>Notes: {e.notes}</Text>:null}</View>)}</Card>}<Card title="Body Progress"><View style={styles.row}><Input small placeholder="kg" value={progress.weight} onChangeText={v=>setProgress({...progress,weight:v})}/><Input small placeholder="waist" value={progress.waist} onChangeText={v=>setProgress({...progress,waist:v})}/><Input small placeholder="chest" value={progress.chest} onChangeText={v=>setProgress({...progress,chest:v})}/></View><View style={styles.row}><Input small placeholder="arms" value={progress.arms} onChangeText={v=>setProgress({...progress,arms:v})}/><Input small placeholder="thighs" value={progress.thighs} onChangeText={v=>setProgress({...progress,thighs:v})}/></View><Button label="Add check-in" onPress={addProgress}/>{state.progress.slice(-8).reverse().map(p=><Text key={p.id} style={styles.text}>{p.date}: {p.weight}kg, waist {p.waist}cm</Text>)}</Card></View>}
 {state.tab==='Settings'&&<View><Card title="Templates" badge={state.templates.length}>{state.templates.length===0?<Text style={styles.muted}>Save a workout template from the Workout tab.</Text>:state.templates.map(t=><View key={t.id} style={styles.food}><Text style={styles.exerciseName}>{t.name}</Text><Text style={styles.muted}>{t.day} • {t.exercises.length} exercises</Text><Button secondary label="Load Template" onPress={()=>loadTemplate(t)}/></View>)}</Card><Card title="Equipment">{state.equipment.map(e=><TouchableOpacity key={e.id} style={[styles.choice,e.enabled&&styles.choiceOn]} onPress={()=>toggleEq(e.id)}><Text style={styles.choiceText}>{e.enabled?'✓':'○'} {e.name}{e.maxKg?` • max ${e.maxKg}kg`:''}{e.increment?` • ${e.increment}kg jumps`:''}</Text></TouchableOpacity>)}<Input placeholder="New equipment name" value={newEq.name} onChangeText={v=>setNewEq({...newEq,name:v})}/><View style={styles.row}><Input small placeholder="max kg" value={newEq.maxKg} onChangeText={v=>setNewEq({...newEq,maxKg:v})} keyboardType="decimal-pad"/><Input small placeholder="jump" value={newEq.increment} onChangeText={v=>setNewEq({...newEq,increment:v})} keyboardType="decimal-pad"/></View><Button label="Add Equipment" onPress={addEquipment}/></Card><Card title="Add Custom Exercise"><Input placeholder="Exercise name" value={custom.name} onChangeText={v=>setCustom({...custom,name:v})}/><View style={styles.choiceRow}>{['Push','Pull','Legs'].map(d=><Button key={d} secondary={custom.day!==d} label={d} onPress={()=>setCustom({...custom,day:d})}/>)}</View><Input placeholder="Muscle e.g. chest, back, quads" value={custom.muscle} onChangeText={v=>setCustom({...custom,muscle:v})}/><Input placeholder="Group e.g. chestPress, row, squat" value={custom.group} onChangeText={v=>setCustom({...custom,group:v})}/><Input placeholder="Equipment comma list" value={custom.equipment} onChangeText={v=>setCustom({...custom,equipment:v})}/><View style={styles.row}><Input small placeholder="sets" value={custom.sets} onChangeText={v=>setCustom({...custom,sets:v})}/><Input small placeholder="reps" value={custom.reps} onChangeText={v=>setCustom({...custom,reps:v})}/><Input small placeholder="kg" value={custom.defaultKg} onChangeText={v=>setCustom({...custom,defaultKg:v})}/></View><Button label="Save Exercise" onPress={addCustom}/></Card><Card title="Backup / Restore"><Button secondary label="Create backup text" onPress={backup}/><Input multiline placeholder="Backup text" value={backupInput||state.backupText} onChangeText={setBackupInput}/><Button label="Restore backup" onPress={restore}/><Button danger label="Reset app" onPress={()=>Alert.alert('Reset app','Delete all local data?',[{text:'Cancel'},{text:'Reset',style:'destructive',onPress:()=>setState(defaultState)}])}/></Card></View>}
 </ScrollView><Tabs tab={state.tab} setTab={t=>patch({tab:t})}/></KeyboardAvoidingView></SafeAreaView>;
}

function generateWorkout({day,allExercises,enabled,workouts,goal,priorities,recovery,randomise=false}){const picked=[],recent=workouts.slice(-3).flatMap(w=>(w.exercises||[]).map(e=>e.name));(dayGroups[day]||[]).forEach((group,idx)=>{let pool=allExercises.filter(e=>e.day===day&&e.group===group&&e.equipment.every(eq=>enabled.includes(eq)));if(!pool.length)pool=allExercises.filter(e=>e.day===day&&e.equipment.every(eq=>enabled.includes(eq)));pool=pool.map(e=>{let score=(recovery[e.muscle]||70)+(priorities.includes(e.muscle)?15:0)+(recent.includes(e.name)?-20:8)+(goal==='Strength'&&e.load==='Heavy'?12:0)+(goal==='Build Muscle'&&e.load!=='Heavy'?8:0)+(goal==='Fat Loss'&&['conditioning','finisher'].includes(e.group)?12:0)+(randomise?Math.random()*35:0)-idx;return{...e,_score:score};}).sort((a,b)=>b._score-a._score);const found=pool.find(e=>!picked.some(p=>p.name===e.name));if(found)picked.push(makeSuggested(found,workouts));});return picked.slice(0,day==='Legs'?7:6);}
function makeSuggested(e,workouts){const kg=suggestKg(e,workouts);return{...e,suggestedKg:kg,done:false,notes:'',setsDone:Array.from({length:e.sets},()=>({kg,reps:e.targetReps,rest:e.rest,done:false}))};}
function smartSwapPool(current,allExercises,enabled,workouts,priorities,recovery){if(!current)return[];const recent=workouts.slice(-4).flatMap(w=>(w.exercises||[]).map(e=>e.name));return allExercises.filter(e=>e.name!==current.name&&e.day===current.day&&e.equipment.every(eq=>enabled.includes(eq))).map(e=>{let score=0; if(e.group===current.group)score+=60; if(e.muscle===current.muscle)score+=30; if(e.load===current.load)score+=8; if(current.alt&&e.name.toLowerCase().includes(current.alt.toLowerCase()))score+=25; if(priorities.includes(e.muscle))score+=10; score+=(recovery[e.muscle]||70)/5; if(recent.includes(e.name))score-=15; return{...e,_score:score};}).sort((a,b)=>b._score-a._score).slice(0,30);}
function Button({label,onPress,secondary,danger}){return <TouchableOpacity onPress={onPress} style={[styles.button,secondary&&styles.secondary,danger&&styles.danger]}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>;}
function Input(p){return <TextInput {...p} placeholderTextColor="#75819a" style={[styles.input,p.small&&styles.smallInput,p.multiline&&{height:120,textAlignVertical:'top'}]}/>;}
function Card({title,badge,children}){return <View style={styles.card}><View style={styles.cardHead}><Text style={styles.cardTitle}>{title}</Text>{badge!==undefined&&badge!==null?<Text style={styles.badge}>{badge}</Text>:null}</View>{children}</View>;}
function Bar({value,max}){return <View style={styles.track}><View style={[styles.fill,{width:`${Math.min(100,(toNum(value)/Math.max(1,toNum(max)))*100)}%`}]}/></View>;}
function StatGrid({data}){return <View style={styles.grid}>{data.map(([label,value])=><View key={label} style={styles.stat}><Text style={styles.heroSmall}>{value}</Text><Text style={styles.muted}>{label}</Text></View>)}</View>;}
function Tabs({tab,setTab}){const tabs=[['Workout','🏋️'],['Recovery','♻️'],['Targets','🎯'],['History','📈'],['Settings','⚙️']];return <View style={styles.tabs}>{tabs.map(([t,i])=><TouchableOpacity key={t} style={styles.tab} onPress={()=>setTab(t)}><Text style={[styles.tabIcon,tab===t&&styles.on]}>{i}</Text><Text style={[styles.tabLabel,tab===t&&styles.on]}>{t}</Text></TouchableOpacity>)}</View>;}
function label(s){return String(s).replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());}
function sum(a){return a.reduce((x,y)=>x+toNum(y),0);}
function workoutVolume(exs){return Math.round(exs.reduce((a,e)=>a+sum((e.setsDone||[]).map(s=>toNum(s.kg)*toNum(s.reps))),0));}
function suggestKg(e,workouts){const sets=workouts.flatMap(w=>w.exercises||[]).filter(x=>x.name===e.name).flatMap(x=>x.setsDone||[]);if(!sets.length)return e.defaultKg;const best=sets.reduce((b,s)=>toNum(s.kg)>toNum(b.kg)?s:b,sets[0]),hitTop=toNum(best.reps)>=toNum(e.targetReps);let step=0.5;if(e.equipment.includes('Barbell')||e.equipment.includes('Tricep Bar')||e.equipment.includes('5ft Standard Barbell'))step=2.5;return round1(toNum(best.kg)+(hitTop?step:0));}
function getPRs(workouts){const prs={};workouts.forEach(w=>(w.exercises||[]).forEach(e=>(e.setsDone||[]).forEach(s=>{const score=toNum(s.kg)*Math.max(1,toNum(s.reps));if(!prs[e.name]||score>prs[e.name].score)prs[e.name]={kg:toNum(s.kg),reps:toNum(s.reps),score};})));return prs;}
function getExerciseStats(workouts){const out={};workouts.forEach(w=>(w.exercises||[]).forEach(e=>{if(!out[e.name])out[e.name]={sessions:0,sets:0,volume:0,best:{kg:0,reps:0,score:0}};out[e.name].sessions+=1;(e.setsDone||[]).forEach(s=>{const v=toNum(s.kg)*toNum(s.reps),score=toNum(s.kg)*Math.max(1,toNum(s.reps));out[e.name].sets+=1;out[e.name].volume+=Math.round(v);if(score>out[e.name].best.score)out[e.name].best={kg:toNum(s.kg),reps:toNum(s.reps),score};});}));return out;}
function volumeLast7(workouts){const min=new Date();min.setDate(min.getDate()-7);return workouts.filter(w=>new Date(w.date)>=min).reduce((a,w)=>a+toNum(w.volume),0);}
function getStreak(s){let count=0;for(let i=0;i<30;i++){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().slice(0,10);if(s.workouts.some(w=>w.date===k))count++;else break;}return count;}
function getWeekStats(workouts){const min=new Date();min.setDate(min.getDate()-7);const ws=workouts.filter(w=>new Date(w.date)>=min);return{workouts:ws.length,volume:ws.reduce((a,w)=>a+toNum(w.volume),0),push:ws.filter(w=>w.day==='Push').length,pull:ws.filter(w=>w.day==='Pull').length,legs:ws.filter(w=>w.day==='Legs').length};}
function getRecovery(workouts){const ms=['chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','core','conditioning'],r=Object.fromEntries(ms.map(m=>[m,100]));workouts.slice(-12).forEach(w=>{const days=Math.max(0,(new Date(today())-new Date(w.date))/(86400000)),impact=Math.max(0,30-days*12);(w.exercises||[]).forEach(e=>{if(r[e.muscle]!==undefined)r[e.muscle]=Math.max(0,Math.round(r[e.muscle]-impact/Math.max(1,(w.exercises||[]).length/3)));});});return r;}
function recoveryAdvice(r){const tired=Object.entries(r).filter(([,v])=>v<55).map(([m])=>label(m));return tired.length?`Take care with: ${tired.join(', ')}. Swap heavy work for lighter movements if needed.`:'Most muscles are fresh. You can train normally.';}
function format(s){const m=Math.floor(s/60);return`${m}:${String(s%60).padStart(2,'0')}`;}
const styles={app:{flex:1,backgroundColor:'#07101f'},header:{padding:18,paddingTop:12,borderBottomWidth:1,borderColor:'#1e2a44'},title:{color:'#fff',fontSize:28,fontWeight:'900'},subtitle:{color:'#9fb0cf',fontWeight:'700'},body:{padding:14,paddingBottom:115},card:{backgroundColor:'#101a2d',borderRadius:22,padding:16,marginBottom:14,borderWidth:1,borderColor:'#243556'},cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},cardTitle:{color:'#fff',fontSize:18,fontWeight:'900'},badge:{color:'#dbe6ff',backgroundColor:'#243a68',paddingHorizontal:10,paddingVertical:5,borderRadius:99,fontWeight:'900'},hero:{color:'#fff',fontSize:26,fontWeight:'900'},heroSmall:{color:'#fff',fontSize:18,fontWeight:'900'},text:{color:'#e7eefc',fontSize:15,fontWeight:'700',marginVertical:2},muted:{color:'#9aa9c4',fontSize:12,fontWeight:'700'},input:{backgroundColor:'#07101f',color:'#fff',borderWidth:1,borderColor:'#31466d',borderRadius:14,padding:12,marginVertical:6,fontWeight:'800'},smallInput:{width:72,textAlign:'center'},button:{backgroundColor:'#4b6bff',padding:12,borderRadius:16,alignItems:'center',marginVertical:5},secondary:{backgroundColor:'#24324f'},danger:{backgroundColor:'#7d2634'},buttonText:{color:'#fff',fontWeight:'900'},track:{height:10,backgroundColor:'#26334d',borderRadius:99,overflow:'hidden',marginVertical:8,flex:1},fill:{height:'100%',backgroundColor:'#57d6a3'},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},stat:{width:'47%',backgroundColor:'#07101f',borderRadius:16,padding:12,borderWidth:1,borderColor:'#263859'},row:{flexDirection:'row',alignItems:'center',gap:7,flexWrap:'wrap'},rowBetween:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},choiceRow:{flexDirection:'row',gap:8,flexWrap:'wrap'},choice:{padding:12,borderRadius:16,backgroundColor:'#07101f',borderWidth:1,borderColor:'#31466d',marginVertical:4},choiceOn:{backgroundColor:'#243a68',borderColor:'#5f7fff'},choiceText:{color:'#fff',fontWeight:'900'},exercise:{borderTopWidth:1,borderColor:'#263859',paddingTop:10,marginTop:8},exerciseDone:{opacity:.72},exerciseName:{color:'#fff',fontSize:16,fontWeight:'900',flex:1},setLabel:{color:'#cbd7ed',fontWeight:'900',width:48},food:{backgroundColor:'#07101f',borderRadius:16,padding:12,marginVertical:5,borderWidth:1,borderColor:'#263859'},history:{backgroundColor:'#07101f',borderRadius:16,padding:12,marginVertical:5,borderWidth:1,borderColor:'#263859'},recoveryRow:{backgroundColor:'#07101f',borderRadius:16,padding:12,marginVertical:5,borderWidth:1,borderColor:'#263859'},tabs:{position:'absolute',left:10,right:10,bottom:10,backgroundColor:'#111a2b',borderRadius:24,borderWidth:1,borderColor:'#2b3b5d',paddingVertical:8,flexDirection:'row'},tab:{alignItems:'center',flex:1},tabIcon:{fontSize:18,opacity:.55},tabLabel:{color:'#8d9bb5',fontSize:10,fontWeight:'900'},on:{color:'#fff',opacity:1},done:{color:'#57d6a3',fontWeight:'900'},tick:{color:'#57d6a3',fontSize:24,fontWeight:'900'},remove:{color:'#ff8a9b',fontSize:26,fontWeight:'900',paddingHorizontal:8}};
