import SwiftUI

enum CurrentView {
    case newFeed
    case hotFeed
}

struct FeedView: View {
    @State private var currentView: CurrentView = .newFeed

    var body: some View {
        NavigationStack {
            VStack {
                TabView(selection: $currentView) {
                    NewFeedView()
                        .tag(CurrentView.newFeed)
                        .tabItem {
                            Text("New")
                        }
                    HotFeedView()
                        .tag(CurrentView.hotFeed)
                        .tabItem {
                            Text("Hot")
                        }
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
            .toolbar {
                ToolbarItemGroup(placement: .principal) {
                    HStack {
                        Button(action: {
                            currentView = .newFeed
                        }) {
                            Text("New")
                                .foregroundColor(currentView == .newFeed ? .green : .gray)
                        }

                        Spacer()
                            .frame(width: 20)

                        Button(action: {
                            currentView = .hotFeed
                        }) {
                            Text("Hot")
                                .foregroundColor(currentView == .hotFeed ? .green : .gray)
                        }
                    }
                }
            }
        }
    }
}

struct NewFeedView: View {
    @StateObject var viewModel = FeedViewModel()
    @State private var scrollPosition: String?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(viewModel.posts) { post in
                    FeedCell(post: post)
                        .id(post.id)
                }
            }
        }
        .navigationTitle("🕛 New")
    }
}

struct HotFeedView: View {
    @StateObject var viewModel = FeedViewModel()
    @State private var scrollPosition: String?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(viewModel.posts) { post in
                    FeedCell(post: post)
                        .id(post.id)
                }
            }
        }
        .navigationTitle("🥵 Hot")
    }
}

#Preview {
    FeedView()
}
