//
//  MainTabView.swift
//  YapYap
//
//  Created by harryhou on 6/4/24.
//

import SwiftUI
import MapKit

struct MainTabView: View {
    @State private var selectedTab = 0
    @State private var previousTab = 0
    @State private var showUploadPostView: Bool = false
    static var userLocation: CLLocationCoordinate2D?
    
    init() {
        let locationManager = CLLocationManager()
            locationManager.requestWhenInUseAuthorization()
            locationManager.startUpdatingLocation()
            
        if let location = locationManager.location {
            MainTabView.userLocation = location.coordinate
        }
        }
    
    var body: some View {
        
        ZStack{
            TabView(selection: $selectedTab) {
                FeedView()
                    .tabItem{
                        VStack {
                            Image(systemName : selectedTab == 0 ? "house.fill": "house")
                                .environment(\.symbolVariants, selectedTab == 0 ? .fill : .none)
                            Text("Home")
                        }
                        
                    }
                    .onAppear {selectedTab = 0}
                    .tag(0)
                
                MapView()
                    .tabItem{
                        VStack {
                            Image(systemName : selectedTab == 1 ? "map.fill": "map")
                                .environment(\.symbolVariants, selectedTab == 1 ? .fill : .none)
                            Text("Map")
                        }
                    }
                    .onAppear {selectedTab = 1}
                    .tag(1)
                
                Text("")
                    .tabItem{ Image(systemName :"plus") }
                    .onAppear {
                        previousTab = selectedTab
                        showUploadPostView.toggle()
                    }
                
                
                NotificationView()
                    .tabItem{
                        VStack {
                            Image(systemName : selectedTab == 3 ? "heart.fill": "heart")
                                .environment(\.symbolVariants, selectedTab == 3 ? .fill : .none)
                            Text("Inbox")
                        }
                    }
                    .onAppear {selectedTab = 3}
                    .tag(3)
                
                CurrentUserProfileView()
                    .tabItem{
                        VStack {
                            Image(systemName : selectedTab == 4 ? "person.fill": "person")
                                .environment(\.symbolVariants, selectedTab == 4 ? .fill : .none)
                            Text("Profile")
                        }
                    }
                    .onAppear {selectedTab = 4}
                    .tag(4)
                
            }
            
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    Button(action: {
                        previousTab = selectedTab
                        showUploadPostView.toggle()
                    }) {
                        Image(systemName: "plus.circle.fill")
                            .resizable()
                            .frame(width: 56, height: 56)
                            .foregroundColor(.green)
                            .background(Circle().fill(Color.white).shadow(radius: 4))
                        
                    }
                    Spacer()
                }
                
            }
            .sheet(isPresented: $showUploadPostView, onDismiss: {
                selectedTab = previousTab
            }) {
                UploadPostView()
            }
            
            
            
        }
        .tint(.green)
    }
}



#Preview {
    MainTabView()
    }

