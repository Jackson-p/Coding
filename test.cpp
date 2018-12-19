#include<iostream>
#include<algorithm>
using namespace std;
int main()
{
    int n,ans;
    ans=0;
    int a[105]={0};
    cin>>n;
    for(int i=0;i<n;i++)
        cin>>a[i];
    for(int i=0;i<n-1;i++)
    {
        if(a[i] ^ a[i+1])
            ans++;
        else if(!a[i]&&!a[i+1])
            ans++;
    }
    cout<<ans<<endl;
}
