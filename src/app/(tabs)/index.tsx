import { Text, View, StyleSheet, SafeAreaView, TouchableOpacity,FlatList, StatusBar, Pressable} from 'react-native';
import { Link } from 'expo-router';
import CustomHeader from '../../components/header';
import Colors from '../../constants/colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';


export default function Index() {
  const notes = [
    {
      id: 1,
      shortTitle: "Grocery List",
      description: "Buy milk, eggs, bread, and fruits from the supermarket. Buy milk, eggs, bread, and fruits from the supermarket. Buy milk, eggs, bread, and fruits from the supermarket. Buy milk, eggs, bread, and fruits from the supermarket. Buy milk, eggs, bread, and fruits from the supermarket. Buy milk, eggs, bread, and fruits from the supermarket.",
      addedDate: "2024-10-01",
      addedTime: "09:30 AM",
    },
    {
      id: 2,
      shortTitle: "Meeting Notes",
      description: "Discuss project milestones and set deadlines for upcoming tasks.",
      addedDate: "2024-10-02",
      addedTime: "11:00 AM",
    },
    {
      id: 3,
      shortTitle: "Workout Plan",
      description: "Focus on cardio exercises and weight training for 45 minutes daily.",
      addedDate: "2024-10-03",
      addedTime: "07:15 AM",
    },
    {
      id: 4,
      shortTitle: "Book to Read",
      description: "Start reading 'Atomic Habits' by James Clear.",
      addedDate: "2024-10-03",
      addedTime: "05:00 PM",
    },
    {
      id: 5,
      shortTitle: "Dinner Recipe",
      description: "Prepare pasta with tomato sauce, garlic bread, and a side salad.",
      addedDate: "2024-10-04",
      addedTime: "06:45 PM",
    },
    {
      id: 6,
      shortTitle: "Work Task",
      description: "Complete API integration and unit testing for the mobile app.",
      addedDate: "2024-10-05",
      addedTime: "10:30 AM",
    },
    {
      id: 7,
      shortTitle: "Weekend Plan",
      description: "Go hiking at the nearby trail and have a picnic at the lake.",
      addedDate: "2024-10-06",
      addedTime: "08:00 AM",
    },
    {
      id: 8,
      shortTitle: "Client Call",
      description: "Call the client to discuss feedback and project updates.",
      addedDate: "2024-10-06",
      addedTime: "03:00 PM",
    },
    {
      id: 9,
      shortTitle: "Doctor Appointment",
      description: "Visit the clinic for a regular health check-up.",
      addedDate: "2024-10-07",
      addedTime: "09:00 AM",
    },
    {
      id: 10,
      shortTitle: "Coding Practice",
      description: "Solve three problems on LeetCode to improve problem-solving skills.",
      addedDate: "2024-10-08",
      addedTime: "05:30 PM",
    },
    {
      id: 11,
      shortTitle: "Pay Bills",
      description: "Pay electricity, water, and internet bills before the due date.",
      addedDate: "2024-10-09",
      addedTime: "04:00 PM",
    },
    {
      id: 12,
      shortTitle: "Movie Night",
      description: "Watch the latest release with friends at the cinema.",
      addedDate: "2024-10-09",
      addedTime: "08:00 PM",
    },
    {
      id: 13,
      shortTitle: "Read Articles",
      description: "Read three tech articles to stay updated with the latest trends.",
      addedDate: "2024-10-10",
      addedTime: "07:00 AM",
    },
    {
      id: 14,
      shortTitle: "Buy Gift",
      description: "Purchase a gift for a friend’s birthday celebration.",
      addedDate: "2024-10-10",
      addedTime: "01:00 PM",
    },
    {
      id: 15,
      shortTitle: "Yoga Session",
      description: "Attend a virtual yoga session for relaxation and meditation.",
      addedDate: "2024-10-11",
      addedTime: "06:00 AM",
    },
    {
      id: 16,
      shortTitle: "Plan Vacation",
      description: "Research and book tickets for a weekend getaway trip.",
      addedDate: "2024-10-12",
      addedTime: "02:30 PM",
    },
    {
      id: 17,
      shortTitle: "Team Meeting",
      description: "Discuss progress, assign tasks, and review project roadmap.",
      addedDate: "2024-10-13",
      addedTime: "10:00 AM",
    },
    {
      id: 18,
      shortTitle: "Guitar Practice",
      description: "Practice playing chords and work on learning a new song.",
      addedDate: "2024-10-13",
      addedTime: "07:30 PM",
    },
    {
      id: 19,
      shortTitle: "Laundry",
      description: "Do the laundry and fold the clothes neatly.",
      addedDate: "2024-10-14",
      addedTime: "11:15 AM",
    },
    {
      id: 20,
      shortTitle: "App Update",
      description: "Check for the latest update for the NoteLo app and apply patches.",
      addedDate: "2024-10-15",
      addedTime: "09:45 AM",
    },
  ];
  type Note = {
    id: number;
    shortTitle: string;
    description: string;
    addedDate: string;
    addedTime: string;
  };
  const renderNote = ({ item }: { item: Note }) => (
    <Link href='./../addNote' asChild>
      <Pressable style={styles.noteContainer} onLongPress={()=>console.log('------------onlong press active')}>
        <Text style={styles.title}>{item.shortTitle}</Text>
        <Text style={styles.description} numberOfLines={4}>{item.description}</Text>
        <Text style={styles.date}>{item.addedDate} - {item.addedTime}</Text>
      </Pressable>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea}>  
      <CustomHeader title="Home" showBackButton={false} />
      {notes.length > 0 ? (
        <>
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContainer}
        />
        <Link href='./../addNote' asChild>
          <TouchableOpacity style={styles.floatingButton} >
            <FontAwesome name="plus" size={24} color={Colors.white} />
          </TouchableOpacity>
        </Link>
        </>
      ) : (
        <View style={styles.container}>
          <Link href="/search" asChild>
            <TouchableOpacity style={styles.buttonContainer}>
              <FontAwesome name="sticky-note" size={100} color={Colors.lightSlate} />
              <Text style={styles.buttonTxt}>Add note</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop:  StatusBar.currentHeight || 0,
  },
  listContainer: {
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  noteContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    flex: 1,
    margin: 5,
  },
  title: {
    fontSize: 16,
    fontFamily:'requiner',
    color: Colors.lightSlate,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    // fontFamily:'premint',
    color: Colors.lightSlate,
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: Colors.lightSlate,
  },
  floatingButton: {
    position:'absolute',
    // alignSelf:'center',
    bottom:30,
    right:40,
    backgroundColor: 'transparent',  // Color of the button
    borderRadius: 30,            // Makes it circular
    borderWidth:1,
    borderColor:Colors.lightSlate,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTxt: {
    fontSize: 20,
    color: Colors.lightSlate,
    fontFamily: 'requiner',
  },
});