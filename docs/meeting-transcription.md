Speakers:
Developer: The person building the software.
Client: The person explaining the business logic (Amazon trucking/logistics).
[02:04] Developer: Hi. So, I’ve already set up the project and am doing the authentication, so I'm still in progress for the authentication. While I’m still in progress... I researched and brainstormed about the project. Also, let me share my screen. Correct me if I’m wrong, I’ve created a system flow diagram. And also, would it be fine for you to explain to me the process... the flow that is convenient for you? Because I need to understand the process so that when I start developing this feature, I can develop it continuously.
[03:22] Developer: Also for the CSV file, would it be fine to explain to me what are those details? Also for confirmation. So this is the system flow diagram that I’ve created. This is the flow... for example, for the bookkeeping, you will upload the bank account statement—I mean bank account transactions—and you will review it and correct it. You can edit the categorization, and also it has an AI which will learn from you. So when you upload another CSV transaction file that has the same [description], it will automatically analyze it. And the P&L updates automatically... revenue, expenses, equals profit. So, is this the flow?
[04:49] Developer: And for the forecasting... predict future cash flow. You will also upload the Amazon payment... "Fixed and Variable Flex Program Payment Summary." And I’m not sure about here: "Input next week capacity." The routes, trucks, and hours. So for the Amazon payment... it calculates expected payout and compares forecast versus actual when the Thursday payout arrives. Is it correct? I want to clarify the flow.
[06:13] Client: Hello?
[06:15] Developer: Hi.
[06:16] Client: Hi.
[06:20] Developer: Hi, so I’ve been working on the authentication. While doing the authentication, I have also brainstormed about the project. And I am still confused about the project. So I want to share my screen right now. I will show you the flow diagram. Also, please bear with me... would it be fine that you explain what the flow is that is convenient for you? Like what is the flow for the bookkeeping and the forecasting... and also for the CSV file? To explain the CSV file, the business account and Amazon payment, for clarification.
[07:29] Client: Yeah. Let me share my screen.
[07:34] Developer: So this is just a system flow diagram. Just correct me if I'm wrong. For the bookkeeping page, is that you will upload the CSV file transactions, which is the bank account transactions? Am I right?
[07:54] Client: Yes.
[07:55] Developer: And then you can review it and correct it by category. And also the AI will learn from your previous corrections so that if it has the same categories, it will automatically detect it. And the P&L updates automatically. Revenue minus expenses equals profit.
[08:18] Developer: And for the forecasting... estimated predict future cash flow. You will also upload the Amazon payment, which is the CSV file Amazon payment information. And I’m not sure about this one... the inputs next week capacity, the routes, the trucks, and hours. And also the app calculates the forecast... the expected payout. And compare forecast versus actual when the payout arrives.
[09:12] Developer: Also for this one, I’m not sure about here. The weekly cycle. Is it like Monday you create a forecast for a week, and then the truck routes, and then when the Amazon pays, it has a forecast versus actual comparison?
[09:40] Developer: For the bookkeeping, it seems fine. You upload the bank CSV and review the P&L file. And yeah, that is the data flow that I have created.
[09:56] Client: Yeah, I like it so far. I think the bookkeeping is pretty straightforward.
[10:04] Developer: Yeah.
[10:06] Client: Yeah. So I just want like a living P&L statement with that information already... Give me one second.
[10:41] Client: Yeah, the flow diagram for the bookkeeping seems pretty straightforward. The forecasting, I’m going to be honest with you... that framework looks good too. I think as we build it out, we can make changes to it. So even for me, I don’t have a really good vision for what that should look like. But what I want to be able to do is... for the model to be able to have a good understanding of the variables. What is the equation? So I think even if you upload... actually, let me do this. Do you use ChatGPT?
[11:34] Developer: Yeah, yeah, yeah.
[11:36] Client: Yeah, maybe let me share one of the ChatGPT files. This is what I’ve been using to do product development. And this is what I use to understand like the revenue... and like the accessorial fees and what are these. So... let me ask it a question.
[12:15] (Client typing prompt into ChatGPT regarding Amazon Logistics logic)
[13:38] (Silence/Typing)
[15:53] Client: Yeah so... really the operating equation is: Total Pay equals Trucks per night times nights in period...
[16:15] Client: ...times tours per truck per night. And so... we have our DTR, is our Daily Tractor Rate. So we always get paid $452. And then "A-Tour", that's accessorial tour. You can use the average—77 has been a good average so far. Plus adjustments. And adjustments are optional.
[17:29] Client: (Reading ChatGPT output) ...So essentially what I'm saying is... it's the number of routes times the rate. Plus the number of routes times the accessorial rate. So really it's... Total Routes times Rate. That's the equation.
[17:58] Client: The rate is $452. That's fixed. And then the accessorial rate varies, but we can use a conservative number of $77. So really, the only variable is the number of routes. The number of routes is determined by how many trucks are running.
[18:32] Developer: Ah, okay.
[18:34] Client: Does that make sense?
[18:35] Developer: Yeah, yeah.
[18:36] Client: So, if we run two trucks for seven days, that is 14 routes.
[18:43] Developer: So the routes are the trips?
[18:46] Client: Yes. Routes, trips... tours. They all mean the same thing.
[18:52] Developer: Ah, okay.
[18:54] Client: Yeah. So... now let me... let me share this so you can have it. Let me get the link and let me add it here.
[19:15] (Client pastes link in chat)
[19:16] Client: Okay, I put it in the Google chat.
[19:20] Developer: So I'll check this one.
[19:22] Client: Yeah, take a look at that. You'll see at the very bottom it'll have the equations. And so you can use some of those equations to build out the variables to be able to manipulate in the forecasting model.
[20:10] Developer: So I will just do research about this and brainstorm about this one.
[20:16] Client: Okay.
[20:18] Developer: Also, it's fine because I can change the system if there is something that needs to change.
[20:25] Client: Yeah, yeah. So I would probably start just using these equations as the variables. And so then those are the numbers that we're going to manipulate. So when we have the forecasting input table... these are the numbers that you could put, right? The number of trucks... how many days are they going to run? They're going to run 7 days. This is weekly. We're trying to forecast a weekly invoice.
[21:00] Client: The number of trucks... the number of trips. The other one... yeah so "Tour" is the trips, right? This is the total trips.
[21:18] Developer: So this is all the inputs for the forecasting, right?
[21:23] Client: Yeah, this is just for the forecasting. The number of loads... So "loads" here are essentially... if you look at the scheduling... sometimes don't you see that a trip will have multiple sub-trips?
[21:55] Developer: Yeah. But they have the same Trip ID, right?
[21:57] Client: Yeah, they have the same Trip ID but they have different sub-trips under that Trip ID. Those sub-trips are the Loads.
[22:06] Developer: Oh, so those are the loads. Alright.
[22:09] Client: Yeah, so sometimes it's three sub-trips, four, five. That gives you the counts. So you can use that and say okay, for the next 7 days, we have two trucks that are running. They are running every night. So we have 14 trips, right? 14 trip IDs. And in those 14 trips, we have 30 loads.
[22:42] Developer: Oh, so those are the same Trip IDs?
[22:45] Client: Yeah the same Trip ID, so each trip might have 4 or 5 loads. Loads are essentially drop-offs. How many drop-offs is each truck doing for one night? Is it doing 2 drop-offs? 3? 6? 7? And depending on the number of drop-offs that you're doing, Amazon is going to pay you accordingly. Because more drop-offs means more work.
[23:13] Developer: All right.
[23:14] Client: And you have to be compensated for that. And so we can try to model that beforehand and say, "Oh, this week..." Okay for example, let me share my screen so I can show you for this week's schedule. Or for example, for tonight's schedule.
[23:54] Client: Oh and in the forecasting... you know how in the bookkeeping we are uploading the CSV file transactions? In the forecasting, we can upload all the trip data. Just like how we upload it for the scheduler? We can use the same CSV file.
[24:16] Developer: Oh, the CSV file scheduler?
[24:18] Client: Yeah. We can use that same CSV file because that's for the next 7 days' trips.
[24:25] Developer: Oh.
[24:26] Client: Yeah. So you can use that data too. You can analyze that and say okay... use this Trips information because it has the trip names, it has the Trip ID, it has the number of sub-trips, it has the dates. So from there, you can extract the capacity. And then use it to auto-fill the number of trucks, the number of trips, and the number of loads.
[24:59] Client: And then from there you can start to calculate how much... what our base rate is going to remain the same, $452. Accessorial fees are dependent on the number of sub-trips. In this equation, you'll see what are the factors. And duration hours. How long is the trip? Is it 9 hours? 10 hours? 8 hours? That's also going to play a little bit of a role. So actually downloading the trip data... using that to analyze... you can extract a lot of this information because the trip data gives you all of that.
[25:52] Client: I would actually give that data to Claude and say, "Hey, can you extract... can you organize this Excel file and be able to extract..." It's all formatted strangely. You have all the IDs, but then all the Trip IDs are in columns. So you could actually say, hey, using the same Trip ID, can you extract all the sub-load IDs? Yeah, let me see... let me share my screen.
[26:50] Client: Yeah are you seeing my screen?
[26:52] Developer: Yeah, yeah, yeah.
[26:55] Client: Okay, perfect. Right so so far we have 21 trips that haven't been scheduled. These are already scheduled. All of these haven't been scheduled. So I'll need to do that.
[27:21] Client: So let me give you an example. So like tonight. For these trips here. Right, so this is the main Trip ID. Right? And then if I click on it... I have... you see how there are sub-trips? You see... You can use these "P"... right? P... and so not the MSP7, that's "Bobtail." That means you aren't carrying anything. Tractor ID... Live... and then this is the first drop-off. So in this trip, we have a drop-off to Prior Lake, Jordan, New Prague, Saint James.
[28:22] Client: Right? And then back to the home station.
[28:27] Developer: Oh wow.
[28:28] Client: So you can... when you're building out the model, the AI detection model, you can build it so that you say, hey... when you're doing your count for the sub-trips, do not count these addresses. So MSP7... and I can put this in the chat.
[29:00] Developer: So the drop-off and the first one?
[29:03] Client: Yeah so don't... yeah... the Bobtail... right? This is the drop-off, the Bobtail... and the first one. So... MSP7. Hold on. Where is it? Yep. So you can say exclude these addresses. Right? So that's MSP7... and if I show you another one, there's going to be an MSP8. Let me see if I can find another one. Let me see this one.
[29:43] Client: Right so this one goes to MSP7 first and then it goes to MSP8. Yeah, so you see? This is going from a station to another station. MSP8. So we wouldn't count this. You see how it says Bobtail? So omit MSP7, MSP8. Let me put this in the chat.
[30:17] Developer: So Bobtail doesn't count.
[30:19] Client: Yeah Bobtail doesn't count. And then I think there's another one that's MSP9. Let me see if I can open this.
[30:30] Client: Yeah, MSP9. Here it is. So these are all Bobtail. Right? So I put it in the chat. So you can say... removing... don't count these as trips. You won't be paid for this. But then everything in the middle... So now you go from MSP9 to this one... Isanti, Minnesota. That would be... so then the AI detection model, if they're looking at this trip here... let me close this...
[31:21] Client: So this is the main trip, and this is the sub-trip ID. And then this is the main one that has all the addresses. If you look at this, you can say okay, there's 1, 2, 3, 4, 5, 6. There's 6 trips. There's 6 sub... so there's 6 drop-offs.
[31:53] Developer: 6 drop-offs.
[31:54] Client: Yeah. So for this trip, it's one trip, so then it would be one trip for that night, and then it would have 6 drop-offs. And then we would use that as the Tour... the Load. The number of loads. So that one has 6. So then we can project and say okay, based on our... And actually let me download the data file, because the data file would show us what things look like.
[33:17] (Client downloading and opening file)
[33:23] Client: Okay, so let me share this screen.
[33:38] Client: Okay so yeah, so you're already familiar with this. So this is the Trips CSV file. Right? So you already know this. There's some canceled so we would... like you already do, we wouldn't get the canceled, only the upcoming ones. And then you have the Load ID...
[33:57] Developer: Yeah.
[34:00] Client: Right? The facility sequence... that's just... we're going MSP7 back to 8, so that's not helpful. So I'm trying to see if there's...
[34:16] Developer: I think the Stop 1, right?
[34:17] Client: Yeah yeah. Stop 1 was MSP7 to 8... Stop 1 wouldn't be helpful. So... Stop 3, 4. Yeah this one has a 5. Some don't have 5. Stop 5 ID... Stop 6, some have 6. And then some have Stop 7. Yeah. So I would count...
[35:10] Client: Yeah I would count from... yeah so... this one... this one says...
[35:36] Client: Okay so these are canceled.
[35:46] Client: So let's try this one here. Load sub-carrier... So we're going from Stop 1 is MSP7. Stop 2. So Stop 2... so this one, you see? That's your first... Stop 2, this is a load right here. So this would be one load. And then we go to Stop 3... you see? It's a different load. That's two loads. Stop 4, you see? This is another load. And then Stop 5 is another load here. And then Stop 6 is another load here.
[36:53] Developer: So that loads belong to that Trip ID, right?
[36:56] Client: Yes.
[36:57] Developer: Yeah, got it.
[36:59] Client: Yeah. I wish... yeah this one won't give you like... so let's see... what date is this? I want to just double check something.
[37:25] Client: So that is... upcoming. Yeah Load ID is... 115XL. And then the Trip ID... what Trip ID is this? 112YY. So let me see something.
[37:51] Client: Yep. And so... 112YY. Load ID is 115XL. Yep, 115XL. That's perfect. Yep. Yep. PY2579. So right, if we come here... right yeah, so PY2793. Okay am I able to... let me see... can I share multiple screens? Let me see.
[38:28] Client: Okay no I can't. Actually let me do this. So we have those 6 trips right? So let me copy those and then let's put them in the chat.
[38:50] (Client copying data to chat)
[39:07] Client: Yeah. So you see that? So it starts off with P25793.
[39:13] Developer: P25494.
[39:16] Client: Yeah. Okay.
[39:26] Client: So you see? So that first one is P2- PY25793. Right? So boom. Right, we pick that up. Then the next one is P2- PY25494. Right? Boom. And then after that is 417879. Boom. Yep. And then after that it's PY24811. And then we got that... and then we got the PY26605. Boom. Yeah. And then this one we don't need it because this is back to... it doesn't count.
[40:17] Developer: All right.
[40:18] Client: So, so that's how we capture the loads. Right? So then in this case we would have 1, 2, 3, yep. We would have a total of 6 stops. See? Yeah. So 6 stops means yeah, 6 drops.
[40:40] Client: So yeah. So we can use that information. And then the good thing is, every night... every night I can manually update the number of real... So this is "scheduled drops," right? Then when we go at night to the routes, we get "real drops." So for example let's say this trip, right? When we go to the station they might say, "Hey, sorry tonight we don't have any loads for Hopkins and Mankato." Right? So we scheduled it, but we don't have the actual shipment. So don't worry, load 3 and 4 are dropped. You see?
[41:33] Client: So now I can go back into my forecasting model and say for this trip, remove two loads. And so now instead of 6 loads, it's actually 4 loads.
[41:48] Developer: Oh.
[41:49] Client: Does that make sense? So I can manually... every day I can manually update it.
[41:53] Developer: All right so you can manually update the count.
[41:55] Client: Exactly. So essentially what I want is... I want to be able to upload that CSV file that I just showed you, extract the theoretical maximum of routes plus loads, and put that into the dashboard on a trip-by-trip basis. I want for it to be able to break it down by Trip ID. Right? And say, Trip ID this, assumes 5 trips. So this is projected. And then there should be another column that says Actual. So I can say... by the end of the night I can say hey, for this trip, it was projected that we were going to do 5, but we only did 2. So in the Actual I could put 2. And so then when we're using the forecasting, we'll use the actual loads that we did.
[42:53] Developer: All right.
[42:54] Client: Yeah. Was this helpful?
[42:56] Developer: Yeah, yeah, yeah. It's helpful.
[42:58] Client: Yeah let me send you that Excel file that I was just playing with. And this is the one for this upcoming week. So let me email that to you.
[43:11] Client: Let me stop sharing.
[43:37] Client: Is this... is this helpful?
[43:38] Developer: Yeah yeah yeah, it's helpful. Thank you so much for that.
[43:42] Client: Yeah absolutely. So let's... let's yeah... let's start with that and you know... see what we can do. And you know, this is... we want to think about this forecasting as a... we'll start off with this and then we'll make some tweaks, you know? And then anytime... every time when we get the data, our invoice, we'll see how things were calculated, where were we off, and then we'll make tweaks. I think over time the model is going to get really good at being able to predict what the invoice will look like for the following week.
[44:17] Developer: All right. So for the business transaction?
[44:22] Client: Yes.
[44:23] Developer: Let me share my screen. So this one... for this one... since for the bookkeeping you will upload the bank account...
[44:39] Client: Yes.
[44:40] Developer: This CSV file, right? How can you categorize this one? This data?
[44:54] Client: Oh okay. What I'll do is over the weekend, let me resend you a new transaction file, and I'll create a new column called Category, and I will categorize these for you. So then you can use those as the initial starting categories. Because these are going to be the most comprehensive. So I will categorize them like Insurance, Driver Pay, Workers Comp. I'll categorize them and then you can use that as the initial categories.
[45:28] Developer: Yeah. So also you can edit the categories, right?
[45:32] Client: Yes yeah. And then... in the system, let's have a way to... if it detects a new transaction and it's uncertain which category to put it, we can manually do it and then the system understands okay this is a new category or this should be labeled this way. So then it could learn from future transactions.
[45:53] Developer: Yeah, got it. Thank you so much.
[45:56] Client: Yeah. How about this one?
[45:59] Developer: Oh no, this one we don't need. This is the summary. The most important part is the Payment Details, the second tab.
[46:08] Developer: All right. So this one.
[46:11] Client: Yeah look at the... yeah the Payment Details. You see there's two tabs, Payment Summary and Payment Details. Look at the second tab. There's two tabs. Yeah look at the bottom.
[46:25] Developer: Ah, I see.
[46:26] Client: This is the most important part. You see? This shows you the trips... the sub-trips. You see the Load ID? You see the number of loads? Yeah, so this shows you for each trip how many loads did we get paid for.
[46:41] Developer: Oh all right, all right.
[46:42] Client: Yeah yeah.
[46:44] Developer: So there's two tabs.
[46:45] Client: Yep. So use this data.
[46:48] Developer: Yeah. So you will upload this one into the forecasting?
[46:55] Client: Exactly.
[46:56] Developer: And also for the trips.
[46:58] Client: Mm-hmm.
[47:00] Developer: All right. So yeah, thank you so much.
[47:03] Client: Yeah. Also, would it be fine... during weekends, if I have some questions or clarifications again, I will just send it through the WhatsApp?
[47:15] Client: Yes, yeah yeah. Just ping me whenever you're free.
[47:19] Developer: So is it fine if I work on weekends?
[47:21] Client: Yeah yeah. I'm always working, so if you're working on some stuff, if I see it I'll respond back.
[47:26] Developer: All right. Yeah. So once again thank you so much. So wrapping up for today and yeah, have a great weekend.
[47:35] Client: Yeah thank you.
[47:36] Developer: And I will continue this on Monday.
[47:39] Client: Okay. Perfect. Yeah absolutely. Have a good weekend.
[47:43] Developer: Thank you.
[47:44] Client: You as well. Bye.